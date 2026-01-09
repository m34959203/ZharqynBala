import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ResultResponseDto,
  ResultDetailDto,
  ResultsHistoryDto,
} from './dto/result-response.dto';

@ApiTags('Results')
@Controller('results')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all results for current user' })
  @ApiResponse({ status: 200, type: ResultsHistoryDto })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ): Promise<ResultsHistoryDto> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.resultsService.findAll(userId, limitNum);
  }

  @Get('child/:childId')
  @ApiOperation({ summary: 'Get results for a specific child' })
  @ApiResponse({ status: 200, type: ResultsHistoryDto })
  async getChildResults(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ResultsHistoryDto> {
    return this.resultsService.getChildResults(childId, userId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get result by session ID' })
  @ApiResponse({ status: 200, type: ResultResponseDto })
  async findBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ResultResponseDto> {
    return this.resultsService.findBySession(sessionId, userId);
  }

  @Get(':id/pdf')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute to prevent abuse
  @ApiOperation({ summary: 'Download result as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file of the result',
    content: { 'application/pdf': {} },
  })
  @ApiTooManyRequestsResponse({ description: 'Too many PDF download requests' })
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.resultsService.generatePdf(id, userId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="result-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }

  @Post('calculate/:sessionId')
  @ApiOperation({ summary: 'Calculate and save result for a completed test session' })
  @ApiResponse({ status: 201, type: ResultDetailDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 403, description: 'Access denied or session not completed' })
  async calculateAndSave(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ResultDetailDto> {
    return this.resultsService.calculateAndSaveResult(sessionId, userId);
  }

  @Patch(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate result with updated scoring logic' })
  @ApiResponse({ status: 200, type: ResultDetailDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async recalculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ResultDetailDto> {
    return this.resultsService.recalculateResult(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed result by ID' })
  @ApiResponse({ status: 200, type: ResultDetailDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ResultDetailDto> {
    return this.resultsService.findOne(id, userId);
  }
}
