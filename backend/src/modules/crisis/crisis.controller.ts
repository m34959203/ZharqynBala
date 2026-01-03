import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CrisisService, CrisisResource } from './crisis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Crisis')
@Controller('crisis')
export class CrisisController {
  constructor(private readonly crisisService: CrisisService) {}

  @Get('resources')
  @Public()
  @ApiOperation({ summary: 'Get crisis hotline resources' })
  @ApiResponse({
    status: 200,
    description: 'List of crisis resources',
  })
  getCrisisResources(): CrisisResource[] {
    return this.crisisService.getCrisisResources();
  }

  @Get('resources/kz')
  @Public()
  @ApiOperation({ summary: 'Get Kazakhstan crisis hotline resources' })
  @ApiResponse({
    status: 200,
    description: 'List of Kazakhstan crisis resources',
  })
  getKzCrisisResources(): CrisisResource[] {
    return this.crisisService.getCrisisResources('KZ');
  }
}
