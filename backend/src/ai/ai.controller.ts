import { Controller, Post, Body, UseGuards, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { ChatRequestDto } from "./dto/chat.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";

@ApiTags("AI Assistant")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send message to AI Assistant with server-side database tool calling" })
  async chat(
    @GetUser() user: any,
    @Body() dto: ChatRequestDto,
  ) {
    return this.aiService.processChat(user, dto.message, dto.history || []);
  }
}
