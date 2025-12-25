import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [SmsService, EmailService, PushService],
  exports: [SmsService, EmailService, PushService],
})
export class NotificationsModule {}
