import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

interface SendSmsOptions {
  phone: string;
  message: string;
  type?: 'VERIFICATION' | 'NOTIFICATION' | 'REMINDER';
}

interface VerificationResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiUrl = 'https://api.mobizon.kz/service';
    this.apiKey = this.configService.get('MOBIZON_API_KEY') || '';
    this.sender = this.configService.get('SMS_SENDER_NAME') || 'ZharqynBala';
    this.isEnabled = this.configService.get('SMS_ENABLED') === 'true';
  }

  async sendSms(options: SendSmsOptions): Promise<boolean> {
    const { phone, message, type = 'NOTIFICATION' } = options;
    const normalizedPhone = this.normalizePhone(phone);

    this.logger.log(`Sending SMS to ${normalizedPhone.slice(0, 7)}***`);

    // Log SMS attempt
    const smsLog = await this.prisma.smsLog.create({
      data: {
        phone: normalizedPhone,
        message,
        type,
        status: 'PENDING',
      },
    });

    if (!this.isEnabled) {
      this.logger.warn('SMS is disabled, skipping send');
      await this.prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { status: 'SKIPPED', note: 'SMS disabled in config' },
      });
      return true; // Return true for development
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/message/sendSmsMessage?apiKey=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: normalizedPhone,
            text: message,
            from: this.sender,
          }),
        },
      );

      const data = await response.json();

      if (data.code === 0) {
        await this.prisma.smsLog.update({
          where: { id: smsLog.id },
          data: {
            status: 'SENT',
            externalId: data.data?.messageId,
          },
        });
        this.logger.log(`SMS sent successfully: ${data.data?.messageId}`);
        return true;
      } else {
        throw new Error(data.message || 'SMS sending failed');
      }
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`);
      await this.prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { status: 'FAILED', error: error.message },
      });
      return false;
    }
  }

  async sendVerificationCode(phone: string): Promise<string> {
    const normalizedPhone = this.normalizePhone(phone);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    await this.prisma.verificationCode.upsert({
      where: { phone: normalizedPhone },
      update: {
        code,
        expiresAt,
        attempts: 0,
      },
      create: {
        phone: normalizedPhone,
        code,
        expiresAt,
        attempts: 0,
      },
    });

    const message = `Ваш код подтверждения ZharqynBala: ${code}. Действителен 10 минут.`;

    await this.sendSms({
      phone: normalizedPhone,
      message,
      type: 'VERIFICATION',
    });

    this.logger.log(`Verification code sent to ${normalizedPhone.slice(0, 7)}***`);

    // In development, return the code for testing
    if (!this.isEnabled) {
      return code;
    }

    return 'sent';
  }

  async verifyCode(phone: string, code: string): Promise<VerificationResult> {
    const normalizedPhone = this.normalizePhone(phone);

    const verification = await this.prisma.verificationCode.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!verification) {
      return { success: false, message: 'Код не найден. Запросите новый.' };
    }

    if (verification.attempts >= 5) {
      return {
        success: false,
        message: 'Превышено количество попыток. Запросите новый код.',
      };
    }

    if (new Date() > verification.expiresAt) {
      return { success: false, message: 'Код истёк. Запросите новый.' };
    }

    // Increment attempts
    await this.prisma.verificationCode.update({
      where: { phone: normalizedPhone },
      data: { attempts: { increment: 1 } },
    });

    if (verification.code !== code) {
      return { success: false, message: 'Неверный код.' };
    }

    // Mark as verified
    await this.prisma.verificationCode.update({
      where: { phone: normalizedPhone },
      data: { verifiedAt: new Date() },
    });

    return { success: true, message: 'Телефон подтверждён.' };
  }

  async sendReminder(
    phone: string,
    childName: string,
    testName: string,
  ): Promise<boolean> {
    const message = `ZharqynBala: Напоминаем о тесте "${testName}" для ${childName}. Пройдите тест в приложении.`;

    return this.sendSms({
      phone,
      message,
      type: 'REMINDER',
    });
  }

  async sendConsultationReminder(
    phone: string,
    psychologistName: string,
    dateTime: Date,
  ): Promise<boolean> {
    const formattedDate = dateTime.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `ZharqynBala: Напоминаем о консультации с ${psychologistName} ${formattedDate}. Не пропустите!`;

    return this.sendSms({
      phone,
      message,
      type: 'REMINDER',
    });
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Kazakhstan phone numbers
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }

    return '+' + cleaned;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
