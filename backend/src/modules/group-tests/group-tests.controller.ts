import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupTestsService } from './group-tests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Group Tests')
@Controller('group-tests')
export class GroupTestsController {
  constructor(private readonly groupTestsService: GroupTestsService) {}

  // ============================================
  // PUBLIC ENDPOINTS (student access via token)
  // ============================================

  @Get('by-token/:token')
  @Public()
  @ApiOperation({ summary: 'Get group test info by token (public)' })
  @ApiResponse({ status: 200, description: 'Group test info with student list' })
  async getByToken(@Param('token') token: string) {
    return this.groupTestsService.getByToken(token);
  }

  @Post('by-token/:token/start')
  @Public()
  @ApiOperation({ summary: 'Get test questions for student (public)' })
  @ApiResponse({ status: 200, description: 'Test questions without scores' })
  async startStudentTest(
    @Param('token') token: string,
    @Body() body: { studentId: string },
  ) {
    return this.groupTestsService.getTestQuestions(token, body.studentId);
  }

  @Post('by-token/:token/complete')
  @Public()
  @ApiOperation({ summary: 'Submit all answers and get result (public)' })
  @ApiResponse({ status: 200, description: 'Test result with score' })
  async submitAnswers(
    @Param('token') token: string,
    @Body()
    body: {
      studentId: string;
      answers: Array<{ questionId: string; answerOptionId: string }>;
    },
  ) {
    return this.groupTestsService.submitAnswers(token, body);
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS (school/admin)
  // ============================================

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group test details with student progress' })
  @ApiResponse({ status: 200, description: 'Group test details with results' })
  async getGroupTest(@Param('id') id: string) {
    return this.groupTestsService.getGroupTestDetails(id);
  }
}
