import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class ChatRequestDto {
  message: string;
  sessionId?: string;
}

class ChatResponseDto {
  response: string;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('interpret/:resultId')
  @ApiOperation({ summary: 'Get AI interpretation for a test result' })
  @ApiResponse({ status: 200 })
  async interpretResult(@Param('resultId', ParseUUIDPipe) resultId: string) {
    return this.aiService.interpretTestResults(resultId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ChatResponseDto> {
    const response = await this.aiService.chat(userId, dto.message, dto.sessionId);
    return { response };
  }
}
