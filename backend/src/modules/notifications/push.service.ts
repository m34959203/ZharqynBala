import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  url?: string;
}

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoredSubscription extends WebPushSubscription {
  userId: string;
  userAgent?: string;
  active: boolean;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly vapidSubject: string;
  private readonly isEnabled: boolean;

  // In-memory subscription storage (would be database in production)
  private subscriptions: Map<string, StoredSubscription> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.vapidPublicKey = this.configService.get('VAPID_PUBLIC_KEY') || '';
    this.vapidPrivateKey = this.configService.get('VAPID_PRIVATE_KEY') || '';
    this.vapidSubject = this.configService.get('VAPID_SUBJECT') || 'mailto:support@zharqynbala.kz';
    this.isEnabled = this.configService.get('PUSH_ENABLED') === 'true';
  }

  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.warn('Push notifications disabled');
      return true;
    }

    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured, skipping push');
      return true;
    }

    try {
      // Get user's push subscriptions from in-memory storage
      const userSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.userId === notification.userId && sub.active);

      if (userSubscriptions.length === 0) {
        this.logger.log(`No push subscriptions for user: ${notification.userId}`);
        return false;
      }

      const results = await Promise.all(
        userSubscriptions.map((sub) =>
          this.sendToSubscription(sub, notification),
        ),
      );

      return results.some((r) => r);
    } catch (error) {
      this.logger.error(`Push notification failed: ${error.message}`);
      return false;
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    notification: Omit<PushNotification, 'userId'>,
  ): Promise<number> {
    let successCount = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.sendPushNotification({
          ...notification,
          userId,
        });
        if (result) successCount++;
      }),
    );

    return successCount;
  }

  async registerSubscription(
    userId: string,
    subscription: WebPushSubscription,
    userAgent?: string,
  ): Promise<void> {
    this.subscriptions.set(subscription.endpoint, {
      ...subscription,
      userId,
      userAgent,
      active: true,
    });

    this.logger.log(`Push subscription registered for user: ${userId}`);
  }

  async unregisterSubscription(endpoint: string): Promise<void> {
    const sub = this.subscriptions.get(endpoint);
    if (sub) {
      sub.active = false;
    }
    this.logger.log(`Push subscription unregistered: ${endpoint.slice(0, 50)}...`);
  }

  async sendTestReminder(
    userId: string,
    testName: string,
    childName: string,
  ): Promise<boolean> {
    return this.sendPushNotification({
      userId,
      title: 'Напоминание о тесте',
      body: `Пора пройти тест "${testName}" для ${childName}`,
      data: { type: 'test_reminder', testName },
      url: '/tests',
    });
  }

  async sendResultReady(
    userId: string,
    testName: string,
    resultId: string,
  ): Promise<boolean> {
    return this.sendPushNotification({
      userId,
      title: 'Результаты готовы!',
      body: `Результаты теста "${testName}" доступны для просмотра`,
      data: { type: 'result_ready', resultId },
      url: `/results/${resultId}`,
    });
  }

  async sendConsultationReminder(
    userId: string,
    psychologistName: string,
    minutesUntil: number,
  ): Promise<boolean> {
    return this.sendPushNotification({
      userId,
      title: 'Скоро консультация',
      body: `Консультация с ${psychologistName} начнётся через ${minutesUntil} минут`,
      data: { type: 'consultation_reminder' },
      url: '/consultations',
    });
  }

  async sendNewRecommendation(
    userId: string,
    category: string,
  ): Promise<boolean> {
    return this.sendPushNotification({
      userId,
      title: 'Новые рекомендации',
      body: `У вас новые AI-рекомендации по теме "${category}"`,
      data: { type: 'new_recommendation', category },
      url: '/results',
    });
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  private async sendToSubscription(
    subscription: StoredSubscription,
    notification: PushNotification,
  ): Promise<boolean> {
    try {
      // Try to use web-push library if installed
      const webpush = require('web-push');

      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: {
          ...notification.data,
          url: notification.url,
        },
      });

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        payload,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push: ${error.message}`);

      // If subscription is invalid, deactivate it
      if (error.statusCode === 404 || error.statusCode === 410) {
        await this.unregisterSubscription(subscription.endpoint);
      }

      return false;
    }
  }
}
