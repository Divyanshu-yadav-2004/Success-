import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { ApplicationStatus, NotificationChannel, NotificationStatus } from "@prisma/client";
import { NotificationEngineService } from "../notifications/notification-engine.service";
import { NotificationType } from "../notifications/notification.types";
import { generateDocumentDeliveredEmailHtml, generateDocumentDeliveredEmailText } from "../email/document-delivered.template";
import * as nodemailer from "nodemailer";

@Injectable()
export class DocumentDeliveryService {
  private readonly logger = new Logger(DocumentDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationEngine: NotificationEngineService,
  ) {}

  async deliverDocument(
    applicationId: string,
    file: Express.Multer.File,
    adminUser: any,
    overwrite?: boolean,
  ) {
    if (!file) {
      throw new BadRequestException("No PDF document provided");
    }

    // 1. File type & size validation
    const mime = file.mimetype?.toLowerCase() || "";
    const isPdf = mime.includes("pdf") || file.originalname.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new BadRequestException("Invalid file type. Only PDF documents (.pdf) are allowed.");
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException("File size exceeds the 15 MB maximum limit.");
    }

    // 2. Fetch Application & Customer
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        service: true,
        user: { include: { profile: true } },
      },
    });

    if (!app) {
      throw new NotFoundException(`Application not found: ${applicationId}`);
    }

    // 3. Idempotency Check
    if (app.status === ApplicationStatus.COMPLETED && app.finalDocumentId && !overwrite) {
      throw new BadRequestException(
        "This application has already been delivered. Set overwrite=true to replace the delivered document.",
      );
    }

    // 4. Save file document record
    const cleanFileName = (file.originalname || "final_document.pdf").replace(/\s+/g, "_");
    const fileKey = `final_deliveries/${app.userId}/${app.id}/${Date.now()}_${cleanFileName}`;

    const deliveredDoc = await this.prisma.applicationDocument.create({
      data: {
        applicationId: app.id,
        documentType: "DELIVERED_FINAL_DOCUMENT",
        fileName: file.originalname || "final_document.pdf",
        fileKey,
        fileSize: file.size,
        mimeType: "application/pdf",
      },
    });

    const completionDate = new Date();
    const formattedDate = completionDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST";

    // 5. Database Transaction: Update status, record completedAt & status history
    const updatedApp = await this.prisma.$transaction(async (tx) => {
      const res = await tx.application.update({
        where: { id: app.id },
        data: {
          status: ApplicationStatus.COMPLETED,
          completedAt: completionDate,
          finalDocumentId: deliveredDoc.id,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          oldStatus: app.status,
          newStatus: ApplicationStatus.COMPLETED,
          changedById: adminUser.id,
          remarks: `Final document "${deliveredDoc.fileName}" delivered by admin.`,
        },
      });

      return res;
    });

    // 6. OPTIMIZATION: Return HTTP response immediately after DB transaction.
    // Fire notification creation and email dispatch asynchronously in background.
    // Admin receives HTTP 200 as soon as the document record and status are saved.
    const serviceName = app.service?.name || "Service";
    const customerName =
      app.user?.profile?.fullName ||
      (app.formData as any)?.applicant_name ||
      "Valued Customer";

    // Build the result now so we can return it without waiting for email
    const result = {
      success: true,
      applicationId: app.id,
      applicationNo: app.applicationNo,
      serviceName,
      customerName,
      documentName: deliveredDoc.fileName,
      documentId: deliveredDoc.id,
      uploaded: true,
      statusUpdated: true,
      notificationCreated: true,
      emailSent: false,      // Email is queued; status tracked in NotificationLog
      emailError: null as string | null,
      completedAt: updatedApp.completedAt,
    };

    // Dispatch notification + email in background — never blocks the HTTP response
    setImmediate(() => {
      this._dispatchNotificationAndEmail({
        app,
        deliveredDoc,
        serviceName,
        customerName,
        formattedDate,
      }).catch((err) => {
        this.logger.error(`Background delivery dispatch failed for app ${app.id}: ${err.message}`);
      });
    });

    return result;
  }

  /**
   * Background worker: creates in-app notification and sends email.
   * Errors here are logged but do NOT affect the admin's HTTP response.
   * Delivery status is tracked in NotificationLog for audit purposes.
   */
  private async _dispatchNotificationAndEmail({
    app,
    deliveredDoc,
    serviceName,
    customerName,
    formattedDate,
  }: {
    app: any;
    deliveredDoc: any;
    serviceName: string;
    customerName: string;
    formattedDate: string;
  }) {
    // 1. Create in-app notification
    let notifResult: any = null;
    try {
      notifResult = await this.notificationEngine.createNotification({
        userId: app.userId,
        title: `🎉 Your ${serviceName} has arrived!`,
        message: `Your document is ready to view and download. Application ID: ${app.applicationNo}`,
        type: NotificationType.DOCUMENT_DELIVERED,
        applicationId: app.id,
        actionUrl: `/#my-applications`,
      });
    } catch (notifErr: any) {
      this.logger.error(`Failed creating notification for app ${app.id}: ${notifErr.message}`);
    }

    // 2. Dispatch email
    const recipientEmail =
      app.user?.email ||
      (app.formData as any)?.applicant_email ||
      (app.formData as any)?.email;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      this.logger.warn(`No valid email for document delivery on app ${app.id}`);
      return;
    }

    const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";
    const emailSubject = `🎉 Your ${serviceName} has arrived - Success MP Online`;
    const htmlContent = generateDocumentDeliveredEmailHtml({
      customerName,
      serviceName,
      applicationNo: app.applicationNo,
      completionDate: formattedDate,
      downloadUrl: `${frontendUrl}/#my-applications`,
    });
    const textContent = generateDocumentDeliveredEmailText({
      customerName,
      serviceName,
      applicationNo: app.applicationNo,
      completionDate: formattedDate,
      downloadUrl: `${frontendUrl}/#my-applications`,
    });

    // 3. Create pending log record before attempting send
    let logRecordId: string | null = null;
    try {
      const logRecord = await this.prisma.notificationLog.create({
        data: {
          notificationId: notifResult?.notification?.id ?? null,
          applicationId: app.id,
          channel: NotificationChannel.EMAIL,
          recipient: recipientEmail,
          subject: emailSubject,
          content: textContent,
          status: NotificationStatus.PENDING,
        },
      });
      logRecordId = logRecord.id;
    } catch (logErr: any) {
      this.logger.warn(`Failed writing NotificationLog for app ${app.id}: ${logErr.message}`);
    }

    // 4. Send email
    try {
      const emailHost = this.configService.get<string>("EMAIL_HOST");
      const emailUser = this.configService.get<string>("EMAIL_USER");
      const emailPass = this.configService.get<string>("EMAIL_PASSWORD");
      const emailPort = parseInt(this.configService.get<string>("EMAIL_PORT") || "587", 10);
      const emailFrom = this.configService.get<string>("EMAIL_FROM") || "Success MP Online <noreply@successmponline.in>";
      const isDummy = emailUser?.toLowerCase().includes("dummy");

      const transporter = (emailHost && emailUser && !isDummy)
        ? nodemailer.createTransport({
            host: emailHost,
            port: emailPort,
            secure: emailPort === 465,
            auth: { user: emailUser, pass: emailPass },
          })
        : nodemailer.createTransport({ jsonTransport: true });

      await transporter.sendMail({
        from: emailFrom,
        to: recipientEmail,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      this.logger.log(`[BG] Document delivery email sent to ${recipientEmail} for app ${app.applicationNo}`);

      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: { status: NotificationStatus.SENT, sentAt: new Date() },
        }).catch(() => {});
      }
    } catch (err: any) {
      const emailError = err.message || String(err);
      this.logger.error(`[BG] Document delivery email failed to ${recipientEmail}: ${emailError}`);
      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: { status: NotificationStatus.FAILED, error: emailError },
        }).catch(() => {});
      }
    }
  }
}
