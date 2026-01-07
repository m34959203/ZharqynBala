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
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AiService, ParsedTestMethodology } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

class ChatRequestDto {
  message: string;
  sessionId?: string;
}

class ChatResponseDto {
  response: string;
}

class ParseMethodologyDto {
  @ApiProperty({ description: 'Text content of the methodology file' })
  @IsString()
  @IsNotEmpty()
  methodologyText: string;
}

class ParseMethodologyResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  parsed: ParsedTestMethodology;
}

class CreateTestFromMethodologyDto {
  @ApiProperty({ description: 'Parsed methodology data' })
  @IsNotEmpty()
  methodology: ParsedTestMethodology;
}

class CreateTestResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  testId: string;
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

  @Post('parse-methodology')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Parse a test methodology text using AI' })
  @ApiResponse({ status: 200, type: ParseMethodologyResponseDto })
  @ApiResponse({ status: 400, description: 'Failed to parse methodology' })
  async parseMethodology(
    @Body() dto: ParseMethodologyDto,
  ): Promise<ParseMethodologyResponseDto> {
    const parsed = await this.aiService.parseTestMethodology(dto.methodologyText);
    return { success: true, parsed };
  }

  @Post('create-test-from-methodology')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a test from parsed methodology' })
  @ApiResponse({ status: 201, type: CreateTestResponseDto })
  async createTestFromMethodology(
    @Body() dto: CreateTestFromMethodologyDto,
  ): Promise<CreateTestResponseDto> {
    const testId = await this.aiService.createTestFromMethodology(dto.methodology);
    return { success: true, testId };
  }
}
