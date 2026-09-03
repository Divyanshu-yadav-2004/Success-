import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /api/v1/documents/upload
   * Legacy route (applicationId in body).
   */
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload application document (applicationId in body)" })
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, any>,
    @GetUser("id") userId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    const applicationId = body?.applicationId;
    const documentType = body?.documentType || body?.docType || body?.type || "document";
    if (!applicationId) {
      throw new BadRequestException("applicationId is required");
    }
    return this.documentsService.recordDocumentUpload(userId, applicationId, documentType, file);
  }

  /**
   * POST /api/v1/documents/upload/:applicationId
   * Frontend-friendly route (applicationId in URL, documentType in body).
   */
  @Post("upload/:applicationId")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload application document (applicationId in URL)" })
  @UseInterceptors(FileInterceptor("file"))
  uploadFileByApp(
    @UploadedFile() file: Express.Multer.File,
    @Param("applicationId") applicationId: string,
    @Body() body: Record<string, any>,
    @GetUser("id") userId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    const documentType = body?.documentType || body?.docType || body?.type || "document";
    return this.documentsService.recordDocumentUpload(userId, applicationId, documentType, file);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Get authorized document download URL" })
  getDownloadUrl(@Param("id") id: string, @GetUser() user: any) {
    return this.documentsService.getDownloadUrl(id, user);
  }

  /**
   * GET /api/v1/documents/application/:applicationId
   * Return all uploaded documents for a specific application.
   */
  @Get("application/:applicationId")
  @ApiOperation({ summary: "Get documents for a specific application" })
  getDocumentsByApplication(
    @Param("applicationId") applicationId: string,
    @GetUser() user: any,
  ) {
    return this.documentsService.getDocumentsByApplication(applicationId, user);
  }
}

