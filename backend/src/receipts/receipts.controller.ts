import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { ReceiptsService } from "./receipts.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("Receipts")
@Controller("receipts")
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(":applicationId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate & download PDF receipt for application" })
  async downloadReceipt(
    @Param("applicationId") applicationId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.receiptsService.generatePdf(applicationId);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt_${applicationId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get("application/:applicationId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate & download PDF receipt for application (alias route)" })
  async downloadReceiptAlias(
    @Param("applicationId") applicationId: string,
    @Res() res: Response,
  ) {
    return this.downloadReceipt(applicationId, res);
  }
}

