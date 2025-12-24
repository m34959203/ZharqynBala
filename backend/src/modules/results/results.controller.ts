import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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
  async findAll(@CurrentUser('id') userId: string): Promise<ResultsHistoryDto> {
    return this.resultsService.findAll(userId);
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
