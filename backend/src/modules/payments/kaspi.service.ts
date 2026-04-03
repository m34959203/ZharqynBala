import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

export interface KaspiPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface KaspiPaymentResponse {
  paymentUrl: string;
  transactionId: string;
}

export interface KaspiWebhookPayload {
  orderId: string;
  status: 'completed' | 'cancelled' | 'expired' | 'failed';
  amount: string;
  signature: string;
}

@Injectable()
export class KaspiService {
  private readonly logger = new Logger(KaspiService.name);
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.merchantId = this.configService.get<string>('KASPI_MERCHANT_ID') || '';
    this.apiKey = this.configService.get<string>('KASPI_API_KEY') || '';
    this.webhookSecret = this.configService.get<string>('KASPI_WEBHOOK_SECRET') || '';
    this.baseUrl = this.configService.get<string>('KASPI_BASE_URL') || 'https://kaspi.kz/pay';
    this.isConfigured = !!(this.merchantId && this.apiKey);

    if (!this.isConfigured) {
      this.logger.warn('Kaspi Pay is not configured. Using sandbox mode.');
    }
  }

  async createPayment(request: KaspiPaymentRequest): Promise<KaspiPaymentResponse> {
    if (!this.isConfigured) {
      return this.createSandboxPayment(request);
    }

    // Real Kaspi Pay integration
    // Kaspi Pay uses a redirect-based flow:
    // 1. Generate signed payment URL with merchant params
    // 2. Redirect user to Kaspi Pay page
    // 3. Kaspi sends webhook on payment completion
    const params = new URLSearchParams({
      merchant_id: this.merchantId,
      order_id: request.orderId,
      amount: request.amount.toString(),
      currency: 'KZT',
      description: request.description,
      return_url: request.returnUrl,
      callback_url: request.callbackUrl,
    });

    const signature = this.generateSignature(params.toString());
    params.append('signature', signature);

    this.logger.log(`Payment created: orderId=${request.orderId}, amount=${request.amount} KZT`);

    return {
      paymentUrl: `${this.baseUrl}/create?${params.toString()}`,
      transactionId: request.orderId,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping verification');
      return this.configService.get('NODE_ENV') !== 'production';
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return payment.status;
  }

  async activateSubscription(userId: string, subscriptionType?: string): Promise<void> {
    const duration = subscriptionType === 'YEARLY' ? 365 : 30;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    const existing = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          plan: 'PREMIUM',
          expiresAt,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId,
          isActive: true,
          plan: 'PREMIUM',
          expiresAt,
        },
      });
    }

    this.logger.log(`Subscription activated for user: ${userId}`);
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(data)
      .digest('hex');
  }

  private createSandboxPayment(request: KaspiPaymentRequest): KaspiPaymentResponse {
    this.logger.log(`[SANDBOX] Payment created: orderId=${request.orderId}, amount=${request.amount} KZT`);

    // In sandbox mode, return a URL that points to our own sandbox endpoint
    // This simulates the Kaspi redirect flow for development
    const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3500';
    const sandboxUrl = `${backendUrl}/api/v1/payments/sandbox/pay?orderId=${request.orderId}&amount=${request.amount}`;

    return {
      paymentUrl: sandboxUrl,
      transactionId: `sandbox-${request.orderId}`,
    };
  }
}
