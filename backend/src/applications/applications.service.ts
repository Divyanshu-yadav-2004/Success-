import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { ApplicationStatus } from "@prisma/client";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const service = await this.prisma.service.findFirst({
      where: {
        OR: [{ id: dto.serviceType }, { code: dto.serviceType }],
      },
    });

    if (!service) {
      throw new BadRequestException(`Invalid service type: ${dto.serviceType}`);
    }

    const shortId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const applicationNo = `SUC-${shortId}`;

    const app = await this.prisma.application.create({
      data: {
        applicationNo,
        userId,
        serviceId: service.id,
        formData: dto.formData,
        amount: service.fee,
        status: ApplicationStatus.SUBMITTED,
        statusHistory: {
          create: {
            oldStatus: undefined,
            newStatus: ApplicationStatus.SUBMITTED,
            changedById: userId,
            remarks: "Application submitted",
          },
        },
      },
      include: {
        service: true,
        user: { include: { profile: true } },
      },
    });

    // Automatically send confirmation email to registered user
    const recipientEmail =
      app.user?.email ||
      (dto.formData as any)?.applicant_email ||
      (dto.formData as any)?.email ||
      "";

    const applicantName =
      app.user?.profile?.fullName ||
      (dto.formData as any)?.applicant_name ||
      (dto.formData as any)?.fullName ||
      "Applicant";

    if (recipientEmail) {
      // Email delivery is non-critical. The application record is already
      // committed, so SMTP latency must never delay the citizen's submission.
      setImmediate(() => {
        this.mailService.sendApplicationConfirmationEmail({
          to: recipientEmail,
          applicantName,
          applicationNo: app.applicationNo,
          serviceName: service.name,
          createdAt: app.createdAt,
          status: app.status,
        }).catch((err) => this.logger.warn(`Confirmation email failed for ${app.id}: ${err.message}`));
      });
    } else {
      this.logger.warn(`No recipient email found for user ${userId} on application ${app.id}`);
    }

    return {
      ...app,
      emailSent: false,
      emailMessage: recipientEmail
        ? "Confirmation email is being sent."
        : "No recipient email address associated with account.",
    };
  }

  async findAllForUser(user: any) {
    const userRole: string = user.role?.name || user.role || "";
    const isAdmin = STAFF_ROLES.includes(userRole);

    // OPTIMIZATION: Select only fields needed for the list view.
    // Documents and full payment history are NOT loaded here — they are
    // fetched only when the admin opens an individual application detail.
    return this.prisma.application.findMany({
      where: isAdmin ? {} : { userId: user.id },
      select: {
        id: true,
        applicationNo: true,
        status: true,
        amount: true,
        paymentStatus: true,
        paymentId: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        service: {
          select: { id: true, name: true, code: true, tagline: true, fee: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: { select: { fullName: true, city: true, district: true } },
          },
        },
        // Include only count of documents, not full binary data
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, user: any) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        service: true,
        user: { include: { profile: true } },
        documents: true,
        payments: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: { changedBy: { include: { profile: true } } },
        },
      },
    });

    if (!app) {
      throw new NotFoundException(`Application not found: ${id}`);
    }

    const userRole: string = user.role?.name || user.role || "";
    const isAdmin = STAFF_ROLES.includes(userRole);
    if (!isAdmin && app.userId !== user.id) {
      throw new NotFoundException(`Application not found: ${id}`);
    }

    return app;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, adminUser: any) {
    const startedAt = performance.now();
    const changedById = typeof adminUser === "string" ? adminUser : (adminUser?.id || adminUser?.sub || null);
    const updated = await this.prisma.$transaction(async (tx) => {
      // Keep the transaction deliberately small: no service/user joins, emails,
      // notifications, document work, or timeline reads are on the response path.
      const app = await tx.application.findUnique({
        where: { id },
        select: { status: true, adminNotes: true },
      });
      if (!app) {
        throw new NotFoundException(`Application not found: ${id}`);
      }

      const result = await tx.application.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes !== undefined ? dto.adminNotes : app.adminNotes,
        },
        // Return only the patch the status screen needs. This avoids Prisma
        // relation hydration before the HTTP response is sent.
        select: {
          id: true,
          status: true,
          adminNotes: true,
          updatedAt: true,
          completedAt: true,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          oldStatus: app.status,
          newStatus: dto.status,
          changedById,
          remarks: dto.adminNotes || `Status updated to ${dto.status}`,
        },
      });

      return result;
    });

    this.logger.debug(`Status update for ${id} completed in ${(performance.now() - startedAt).toFixed(1)}ms`);
    return updated;
  }
}
