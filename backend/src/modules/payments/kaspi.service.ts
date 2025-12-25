import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

interface KaspiPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  returnUrl: string;
  callbackUrl: string;
  userId: string;
  subscriptionType: 'MONTHLY' | 'YEARLY';
}

interface KaspiPaymentResponse {
  paymentId: string;
  redirectUrl: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

interface KaspiWebhookPayload {
  paymentId: string;
  orderId: string;
  status: 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  amount: number;
  paidAt?: string;
  signature: string;
}

@Injectable()
export class KaspiService {
  private readonly logger = new Logger(KaspiService.name);
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.apiUrl = this.isProduction
      ? 'https://pay.kaspi.kz/api/v1'
      : 'https://pay-test.kaspi.kz/api/v1';
    this.merchantId = this.configService.get('KASPI_MERCHANT_ID') || '';
    this.secretKey = this.configService.get('KASPI_SECRET_KEY') || '';
  }

  async createPayment(request: KaspiPaymentRequest): Promise<KaspiPaymentResponse> {
    this.logger.log(`Creating Kaspi payment for order: ${request.orderId}`);

    try {
      // Create payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          orderId: request.orderId,
          amount: request.amount,
          currency: 'KZT',
          status: 'PENDING',
          provider: 'KASPI',
          userId: request.userId,
          metadata: {
            subscriptionType: request.subscriptionType,
            description: request.description,
          },
        },
      });

      // Prepare request to Kaspi API
      const payload = {
        merchantId: this.merchantId,
        orderId: request.orderId,
        amount: request.amount,
        description: request.description,
        returnUrl: request.returnUrl,
        callbackUrl: request.callbackUrl,
        currency: 'KZT',
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);

      // In production, make actual API call
      if (this.isProduction) {
        const response = await fetch(`${this.apiUrl}/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId,
            'X-Signature': signature,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new HttpException(
            'Kaspi payment creation failed',
            HttpStatus.BAD_GATEWAY,
          );
        }

        const data = await response.json();

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { externalId: data.paymentId },
        });

        return {
          paymentId: data.paymentId,
          redirectUrl: data.redirectUrl,
          status: 'PENDING',
        };
      }

      // Test mode response
      return {
        paymentId: `test_${payment.id}`,
        redirectUrl: `${this.apiUrl}/test-payment/${payment.id}`,
        status: 'PENDING',
      };
    } catch (error) {
      this.logger.error(`Failed to create Kaspi payment: ${error.message}`);
      throw new HttpException(
        'Payment creation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleWebhook(payload: KaspiWebhookPayload): Promise<void> {
    this.logger.log(`Received Kaspi webhook for order: ${payload.orderId}`);

    // Verify signature
    if (!this.verifySignature(payload)) {
      this.logger.warn('Invalid webhook signature');
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId: payload.orderId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for order: ${payload.orderId}`);
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    // Update payment status
    const status = this.mapKaspiStatus(payload.status);
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : null,
        metadata: {
          ...payment.metadata as object,
          kaspiStatus: payload.status,
        },
      },
    });

    // If payment successful, activate subscription
    if (status === 'COMPLETED') {
      await this.activateSubscription(payment);
    }

    this.logger.log(`Payment ${payment.id} updated to status: ${status}`);
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentId }, { externalId: paymentId }],
      },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    // In production, also check with Kaspi API
    if (this.isProduction && payment.externalId) {
      try {
        const signature = this.generateSignature({ paymentId: payment.externalId });
        const response = await fetch(
          `${this.apiUrl}/payments/${payment.externalId}/status`,
          {
            headers: {
              'X-Merchant-Id': this.merchantId,
              'X-Signature': signature,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          return data.status;
        }
      } catch (error) {
        this.logger.error(`Failed to check payment status: ${error.message}`);
      }
    }

    return payment.status;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    if (payment.status !== 'COMPLETED') {
      throw new HttpException(
        'Only completed payments can be refunded',
        HttpStatus.BAD_REQUEST,
      );
    }

    const refundAmount = amount || payment.amount;

    if (this.isProduction) {
      const payload = {
        paymentId: payment.externalId,
        amount: refundAmount,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);

      const response = await fetch(`${this.apiUrl}/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new HttpException('Refund failed', HttpStatus.BAD_GATEWAY);
      }
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      },
    });

    // Deactivate subscription
    await this.deactivateSubscription(payment.userId);

    return true;
  }

  private async activateSubscription(payment: any): Promise<void> {
    const metadata = payment.metadata as any;
    const duration =
      metadata.subscriptionType === 'YEARLY' ? 365 : 30;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    await this.prisma.subscription.upsert({
      where: { userId: payment.userId },
      update: {
        status: 'ACTIVE',
        plan: 'PREMIUM',
        expiresAt,
        paymentId: payment.id,
      },
      create: {
        userId: payment.userId,
        status: 'ACTIVE',
        plan: 'PREMIUM',
        expiresAt,
        paymentId: payment.id,
      },
    });

    this.logger.log(`Subscription activated for user: ${payment.userId}`);
  }

  private async deactivateSubscription(userId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { userId },
      data: { status: 'CANCELLED' },
    });
  }

  private generateSignature(data: any): string {
    const crypto = require('crypto');
    const sortedData = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(sortedData)
      .digest('hex');
  }

  private verifySignature(payload: KaspiWebhookPayload): boolean {
    const { signature, ...data } = payload;
    const expectedSignature = this.generateSignature(data);
    return signature === expectedSignature;
  }

  private mapKaspiStatus(kaspiStatus: string): string {
    const statusMap: Record<string, string> = {
      PAID: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      EXPIRED: 'EXPIRED',
      FAILED: 'FAILED',
    };
    return statusMap[kaspiStatus] || 'PENDING';
  }
}
