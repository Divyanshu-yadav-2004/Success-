import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async recordDocumentUpload(
    userId: string,
    applicationId: string,
    documentType: string,
    file: Express.Multer.File,
  ) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new NotFoundException(`Application not found: ${applicationId}`);
    }

    if (app.userId !== userId) {
      throw new BadRequestException("Unauthorized to upload documents for this application");
    }

    const safeDocType = (documentType || "document").trim();

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 10 MB limit");
    }

    // Validate mime type
    const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (file.mimetype && !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type. Only JPG, PNG and PDF allowed.");
    }

    const cleanFileName = (file.originalname || "file").replace(/\s+/g, "_");
    const fileKey = `${userId}/${applicationId}/${Date.now()}_${cleanFileName}`;

    const doc = await this.prisma.applicationDocument.create({
      data: {
        applicationId,
        documentType: safeDocType,
        fileName: file.originalname || "uploaded_file",
        fileKey,
        fileSize: file.size || 0,
        mimeType: file.mimetype || "application/octet-stream",
      },
    });

    // Sync into application formData documents field safely
    try {
      const existingFormData =
        typeof app.formData === "object" && app.formData !== null
          ? JSON.parse(JSON.stringify(app.formData))
          : {};
      const existingDocs = existingFormData.documents || {};
      existingDocs[safeDocType] = {
        name: file.originalname || "uploaded_file",
        key: fileKey,
        size: file.size,
        mime: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };

      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          formData: {
            ...existingFormData,
            documents: existingDocs,
          },
        },
      });
    } catch (err) {
      console.error("Non-fatal error updating application formData.documents:", err);
    }

    return doc;
  }

  async getDownloadUrl(documentId: string, user: any) {
    const doc = await this.prisma.applicationDocument.findUnique({
      where: { id: documentId },
      include: { application: true },
    });

    if (!doc) {
      throw new NotFoundException("Document not found");
    }

    const userRole: string = user.role?.name || user.role || "";
    const isAdmin = STAFF_ROLES.includes(userRole);

    if (!isAdmin && doc.application.userId !== user.id) {
      throw new NotFoundException("Document not found or unauthorized");
    }

    // Return the file key so the frontend/admin can request the file
    // via a dedicated file-serving endpoint or a configured storage URL.
    const storageEndpoint = this.configService.get<string>("STORAGE_ENDPOINT") || "";
    const storageBucket = this.configService.get<string>("STORAGE_BUCKET") || "application-documents";

    const downloadUrl = storageEndpoint
      ? `${storageEndpoint}/${storageBucket}/${doc.fileKey}`
      : `/api/v1/documents/file/${doc.fileKey}`;

    return {
      documentId: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileKey: doc.fileKey,
      downloadUrl,
    };
  }

  async getDocumentsByApplication(applicationId: string, user: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new NotFoundException(`Application not found: ${applicationId}`);
    }

    const userRole: string = user.role?.name || user.role || "";
    const isAdmin = STAFF_ROLES.includes(userRole);

    if (!isAdmin && app.userId !== user.id) {
      throw new BadRequestException("Unauthorized to access documents for this application");
    }

    return this.prisma.applicationDocument.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: "desc" },
    });
  }
}

