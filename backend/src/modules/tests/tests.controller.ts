import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  TestResponseDto,
  TestDetailDto,
  TestSessionResponseDto,
  AnswerResponseDto,
} from './dto/test-response.dto';
import { StartTestDto, SubmitAnswerDto, TestFilterDto } from './dto/test-request.dto';
import { TestCategory } from '@prisma/client';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all available tests' })
  @ApiQuery({ name: 'category', enum: TestCategory, required: false })
  @ApiQuery({ name: 'isPremium', type: Boolean, required: false })
  @ApiResponse({ status: 200, type: [TestResponseDto] })
  async findAll(@Query() filter: TestFilterDto): Promise<TestResponseDto[]> {
    return this.testsService.findAll(filter);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get test details with questions' })
  @ApiResponse({ status: 200, type: TestDetailDto })
  async findOne(@Param('id') id: string): Promise<TestDetailDto> {
    return this.testsService.findOne(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a test session' })
  @ApiResponse({ status: 201, type: TestSessionResponseDto })
  @ApiResponse({ status: 402, description: 'Payment required' })
  async startTest(
    @Param('id') id: string,
    @Body() dto: StartTestDto,
    @CurrentUser('id') userId: string,
  ): Promise<TestSessionResponseDto> {
    return this.testsService.startTest(id, userId, dto);
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session status' })
  @ApiResponse({ status: 200, type: TestSessionResponseDto })
  async getSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<TestSessionResponseDto> {
    return this.testsService.getSessionStatus(sessionId);
  }

  @Post('sessions/:sessionId/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an answer to a question' })
  @ApiResponse({ status: 200, type: AnswerResponseDto })
  async submitAnswer(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser('id') userId: string,
  ): Promise<AnswerResponseDto> {
    return this.testsService.submitAnswer(sessionId, userId, dto);
  }

  @Post('sessions/:sessionId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force complete a test session' })
  @ApiResponse({ status: 200 })
  async completeSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.testsService.completeSession(sessionId, userId);
  }
}
