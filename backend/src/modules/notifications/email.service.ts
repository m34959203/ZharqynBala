import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get('SENDGRID_API_KEY') || '';
    this.fromEmail = this.configService.get('EMAIL_FROM') || 'noreply@zharqynbala.kz';
    this.fromName = this.configService.get('EMAIL_FROM_NAME') || 'ZharqynBala';
    this.isEnabled = this.configService.get('EMAIL_ENABLED') === 'true';
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    this.logger.log(`Sending email to ${to}: ${subject}`);

    // Log email attempt
    const emailLog = await this.prisma.emailLog.create({
      data: {
        to,
        subject,
        status: 'PENDING',
        template: options.template,
      },
    });

    if (!this.isEnabled) {
      this.logger.warn('Email is disabled, skipping send');
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'SKIPPED', note: 'Email disabled in config' },
      });
      return true;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.fromEmail, name: this.fromName },
          subject,
          content: [
            { type: 'text/plain', value: text || this.htmlToText(html) },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (response.ok) {
        await this.prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        this.logger.log(`Email sent successfully to ${to}`);
        return true;
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'FAILED', error: error.message },
      });
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.getTemplate('welcome', { name });
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'welcome',
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const template = this.getTemplate('password-reset', { resetUrl });
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'password-reset',
    });
  }

  async sendTestResultEmail(
    email: string,
    childName: string,
    testName: string,
    score: number,
    resultUrl: string,
  ): Promise<boolean> {
    const template = this.getTemplate('test-result', {
      childName,
      testName,
      score,
      resultUrl,
    });
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'test-result',
    });
  }

  async sendConsultationConfirmation(
    email: string,
    psychologistName: string,
    dateTime: Date,
    meetingUrl: string,
  ): Promise<boolean> {
    const formattedDate = dateTime.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const template = this.getTemplate('consultation-confirmation', {
      psychologistName,
      dateTime: formattedDate,
      meetingUrl,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'consultation-confirmation',
    });
  }

  async sendSubscriptionActivated(
    email: string,
    plan: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const formattedExpiry = expiresAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const template = this.getTemplate('subscription-activated', {
      plan,
      expiresAt: formattedExpiry,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'subscription-activated',
    });
  }

  async sendSubscriptionExpiring(email: string, daysLeft: number): Promise<boolean> {
    const template = this.getTemplate('subscription-expiring', { daysLeft });
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      template: 'subscription-expiring',
    });
  }

  private getTemplate(
    templateName: string,
    data: Record<string, any>,
  ): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        subject: 'Добро пожаловать в ZharqynBala!',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Здравствуйте, ${data.name}!</h2>
              <p>Добро пожаловать в ZharqynBala — платформу психологической диагностики детей.</p>
              <p>Теперь вы можете:</p>
              <ul>
                <li>Проходить психологические тесты для детей</li>
                <li>Получать AI-рекомендации</li>
                <li>Записываться на консультации к психологам</li>
                <li>Отслеживать развитие ребёнка</li>
              </ul>
              <a href="${this.configService.get('FRONTEND_URL')}/dashboard"
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Начать работу
              </a>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ZharqynBala. Все права защищены.</p>
            </div>
          </body>
          </html>
        `,
        text: `Здравствуйте, ${data.name}! Добро пожаловать в ZharqynBala — платформу психологической диагностики детей.`,
      },
      'password-reset': {
        subject: 'Сброс пароля ZharqynBala',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Сброс пароля</h2>
              <p>Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы создать новый пароль:</p>
              <a href="${data.resetUrl}"
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Сбросить пароль
              </a>
              <p style="color: #666; font-size: 14px;">Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
            </div>
          </body>
          </html>
        `,
        text: `Вы запросили сброс пароля. Перейдите по ссылке: ${data.resetUrl}`,
      },
      'test-result': {
        subject: `Результаты теста "${data.testName}" для ${data.childName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Результаты теста</h2>
              <p><strong>Ребёнок:</strong> ${data.childName}</p>
              <p><strong>Тест:</strong> ${data.testName}</p>
              <p><strong>Результат:</strong> ${data.score} баллов</p>
              <a href="${data.resultUrl}"
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Посмотреть подробности
              </a>
            </div>
          </body>
          </html>
        `,
        text: `Результаты теста "${data.testName}" для ${data.childName}: ${data.score} баллов. Подробнее: ${data.resultUrl}`,
      },
      'consultation-confirmation': {
        subject: 'Консультация подтверждена - ZharqynBala',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Консультация подтверждена!</h2>
              <p><strong>Психолог:</strong> ${data.psychologistName}</p>
              <p><strong>Дата и время:</strong> ${data.dateTime}</p>
              <a href="${data.meetingUrl}"
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Присоединиться к встрече
              </a>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">Ссылка станет активной за 5 минут до начала.</p>
            </div>
          </body>
          </html>
        `,
        text: `Консультация с ${data.psychologistName} подтверждена на ${data.dateTime}. Ссылка: ${data.meetingUrl}`,
      },
      'subscription-activated': {
        subject: 'Подписка активирована - ZharqynBala',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Подписка активирована!</h2>
              <p>Ваш тариф: <strong>${data.plan}</strong></p>
              <p>Действует до: <strong>${data.expiresAt}</strong></p>
              <p>Теперь вам доступны:</p>
              <ul>
                <li>Все психологические тесты</li>
                <li>Расширенные AI-рекомендации</li>
                <li>Консультации с психологами</li>
                <li>История и аналитика</li>
              </ul>
            </div>
          </body>
          </html>
        `,
        text: `Подписка ${data.plan} активирована до ${data.expiresAt}.`,
      },
      'subscription-expiring': {
        subject: 'Подписка скоро истекает - ZharqynBala',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZharqynBala</h1>
            </div>
            <div style="padding: 40px;">
              <h2>Подписка скоро истекает</h2>
              <p>Ваша подписка истекает через <strong>${data.daysLeft} дней</strong>.</p>
              <p>Продлите подписку, чтобы не потерять доступ к премиум-функциям.</p>
              <a href="${this.configService.get('FRONTEND_URL')}/subscription"
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Продлить подписку
              </a>
            </div>
          </body>
          </html>
        `,
        text: `Ваша подписка истекает через ${data.daysLeft} дней. Продлите на сайте.`,
      },
    };

    return templates[templateName] || templates.welcome;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
