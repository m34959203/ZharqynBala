import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  @Post('sms/send-code')
  @ApiOperation({ summary: 'Send SMS verification code' })
  async sendVerificationCode(@Body('phone') phone: string) {
    const result = await this.smsService.sendVerificationCode(phone);
    return { success: true, message: 'Код отправлен', debug: result };
  }

  @Post('sms/verify')
  @ApiOperation({ summary: 'Verify SMS code' })
  async verifySmsCode(
    @Body('phone') phone: string,
    @Body('code') code: string,
  ) {
    return this.smsService.verifyCode(phone, code);
  }

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribePush(
    @Req() req: any,
    @Body() subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    await this.pushService.registerSubscription(
      req.user.id,
      subscription,
      req.headers['user-agent'],
    );
    return { success: true, message: 'Подписка оформлена' };
  }

  @Delete('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribePush(@Body('endpoint') endpoint: string) {
    await this.pushService.unregisterSubscription(endpoint);
    return { success: true, message: 'Подписка отменена' };
  }

  @Get('push/vapid-key')
  @ApiOperation({ summary: 'Get VAPID public key for push notifications' })
  getVapidKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('test/email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test email (development only)' })
  async sendTestEmail(@Req() req: any) {
    const result = await this.emailService.sendWelcomeEmail(
      req.user.email,
      req.user.name,
    );
    return { success: result };
  }

  @Post('test/push')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test push notification' })
  async sendTestPush(@Req() req: any) {
    const result = await this.pushService.sendPushNotification({
      userId: req.user.id,
      title: 'Тестовое уведомление',
      body: 'Push уведомления работают!',
    });
    return { success: result };
  }
}
