import { Module } from '@nestjs/common';
import { GroupTestsController } from './group-tests.controller';
import { GroupTestsService } from './group-tests.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroupTestsController],
  providers: [GroupTestsService],
  exports: [GroupTestsService],
})
export class GroupTestsModule {}
