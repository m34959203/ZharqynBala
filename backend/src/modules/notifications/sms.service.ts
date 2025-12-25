import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendSmsOptions {
  phone: string;
  message: string;
  type?: 'VERIFICATION' | 'NOTIFICATION' | 'REMINDER';
}

export interface VerificationResult {
  success: boolean;
  message: string;
}

interface StoredVerification {
  code: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly isEnabled: boolean;

  // In-memory verification code storage
  private verificationCodes: Map<string, StoredVerification> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = 'https://api.mobizon.kz/service';
    this.apiKey = this.configService.get('MOBIZON_API_KEY') || '';
    this.sender = this.configService.get('SMS_SENDER_NAME') || 'ZharqynBala';
    this.isEnabled = this.configService.get('SMS_ENABLED') === 'true';
  }

  async sendSms(options: SendSmsOptions): Promise<boolean> {
    const { phone, message } = options;
    const normalizedPhone = this.normalizePhone(phone);

    this.logger.log(`Sending SMS to ${normalizedPhone.slice(0, 7)}***`);

    if (!this.isEnabled) {
      this.logger.warn('SMS is disabled, skipping send');
      return true;
    }

    if (!this.apiKey) {
      this.logger.warn('Mobizon API key not configured, skipping send');
      return true;
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
        this.logger.log(`SMS sent successfully: ${data.data?.messageId}`);
        return true;
      } else {
        throw new Error(data.message || 'SMS sending failed');
      }
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`);
      return false;
    }
  }

  async sendVerificationCode(phone: string): Promise<string> {
    const normalizedPhone = this.normalizePhone(phone);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in memory
    this.verificationCodes.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      verified: false,
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

    const verification = this.verificationCodes.get(normalizedPhone);

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
      this.verificationCodes.delete(normalizedPhone);
      return { success: false, message: 'Код истёк. Запросите новый.' };
    }

    // Increment attempts
    verification.attempts++;

    if (verification.code !== code) {
      return { success: false, message: 'Неверный код.' };
    }

    // Mark as verified
    verification.verified = true;

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
