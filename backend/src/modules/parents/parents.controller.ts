import { Controller, Get, UseGuards, Req, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { ParentOverviewDto } from './dto/parent-overview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Parents')
@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
@ApiBearerAuth()
export class ParentsController {
  constructor(private readonly parents: ParentsService) {}

  @Get('me/overview')
  @ApiOperation({ summary: 'Сводка дашборда родителя — дети, статистика, AI-рекомендация' })
  @ApiResponse({ status: 200, type: ParentOverviewDto })
  @Header('Cache-Control', 'private, max-age=30')
  async getOverview(@Req() req: { user: { id: string } }): Promise<ParentOverviewDto> {
    return this.parents.getOverview(req.user.id);
  }
}
