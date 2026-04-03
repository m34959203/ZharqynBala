import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentType, PaymentProvider, TransactionStatus } from '@prisma/client';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentHistoryDto,
  KaspiWebhookDto,
} from './dto/payment.dto';
import { KaspiService } from './kaspi.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private kaspiService: KaspiService,
  ) {}

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // Get amount based on payment type
    let amount = 0;

    switch (dto.paymentType) {
      case PaymentType.DIAGNOSTIC:
        const test = await this.prisma.test.findUnique({
          where: { id: dto.relatedId },
        });
        if (!test) {
          throw new NotFoundException('Test not found');
        }
        amount = test.price;
        break;

      case PaymentType.CONSULTATION:
        const consultation = await this.prisma.consultation.findUnique({
          where: { id: dto.relatedId },
        });
        if (!consultation) {
          throw new NotFoundException('Consultation not found');
        }
        amount = consultation.price;
        break;

      case PaymentType.SUBSCRIPTION:
        // Default subscription prices
        const subscriptionPrices: Record<string, number> = {
          BASIC: 0,
          STANDARD: 3000,
          PREMIUM: 5000,
          FAMILY: 8000,
        };
        amount = subscriptionPrices[dto.relatedId] || 5000;
        break;

      default:
        throw new BadRequestException('Invalid payment type');
    }

    // If amount is 0, mark as completed immediately
    if (amount === 0) {
      const payment = await this.prisma.payment.create({
        data: {
          userId,
          amount: 0,
          currency: 'KZT',
          paymentType: dto.paymentType,
          relatedId: dto.relatedId,
          provider: dto.provider || PaymentProvider.KASPI,
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      return this.mapToDto(payment);
    }

    // Create pending payment
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'KZT',
        paymentType: dto.paymentType,
        relatedId: dto.relatedId,
        provider: dto.provider || PaymentProvider.KASPI,
        status: TransactionStatus.PENDING,
      },
    });

    // Generate payment URL via Kaspi service
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3400';
    const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3500';

    const kaspiResult = await this.kaspiService.createPayment({
      orderId: payment.id,
      amount: payment.amount,
      description: `ZharqynBala - ${dto.paymentType}`,
      returnUrl: `${frontendUrl}/payment/status?id=${payment.id}`,
      callbackUrl: `${backendUrl}/api/v1/payments/webhook/kaspi`,
    });

    return {
      ...this.mapToDto(payment),
      paymentUrl: kaspiResult.paymentUrl,
    };
  }

  async getPaymentHistory(userId: string): Promise<PaymentHistoryDto> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      payments: payments.map((p) => this.mapToDto(p)),
      total: payments.length,
    };
  }

  async getPayment(id: string, userId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapToDto(payment);
  }

  async getPaymentPublic(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapToDto(payment);
  }

  async handleKaspiWebhook(dto: KaspiWebhookDto): Promise<{ result: number }> {
    this.logger.log(`Kaspi webhook received: ${JSON.stringify(dto)}`);

    // Find payment by external ID or by account (payment ID)
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [{ externalId: dto.txn_id }, { id: dto.account }],
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for txn_id: ${dto.txn_id}`);
      return { result: 1 }; // Error code
    }

    if (dto.command === 'check') {
      // Check command - verify payment exists
      return { result: 0 };
    }

    if (dto.command === 'pay') {
      // Pay command - confirm payment
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: TransactionStatus.COMPLETED,
          externalId: dto.txn_id,
          completedAt: new Date(),
        },
      });

      // Update consultation paymentStatus if this is a consultation payment
      if (payment.paymentType === PaymentType.CONSULTATION && payment.relatedId) {
        await this.prisma.consultation.update({
          where: { id: payment.relatedId },
          data: { paymentStatus: 'PAID', paymentId: payment.id },
        }).catch(() => {});
      }

      // Activate subscription if this is a subscription payment
      if (payment.paymentType === PaymentType.SUBSCRIPTION) {
        await this.kaspiService.activateSubscription(payment.userId, payment.relatedId ?? undefined);
      }

      return { result: 0 };
    }

    return { result: 0 };
  }

  async handleSandboxWebhook(orderId: string, status: string, amount: string): Promise<string> {
    this.logger.log(`[SANDBOX] Webhook: orderId=${orderId}, status=${status}, amount=${amount}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (status === 'completed') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update consultation paymentStatus
      if (payment.paymentType === PaymentType.CONSULTATION && payment.relatedId) {
        await this.prisma.consultation.update({
          where: { id: payment.relatedId },
          data: { paymentStatus: 'PAID', paymentId: payment.id },
        }).catch(() => {});
      }

      // Activate subscription if applicable
      if (payment.paymentType === PaymentType.SUBSCRIPTION) {
        await this.kaspiService.activateSubscription(payment.userId, payment.relatedId ?? undefined);
      }
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: TransactionStatus.FAILED,
        },
      });
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3400';
    return `${frontendUrl}/payment/status?id=${payment.id}`;
  }

  // Simulate payment completion for development
  async simulatePaymentComplete(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update consultation paymentStatus
    if (updated.paymentType === PaymentType.CONSULTATION && updated.relatedId) {
      await this.prisma.consultation.update({
        where: { id: updated.relatedId },
        data: { paymentStatus: 'PAID', paymentId: updated.id },
      }).catch(() => {});
    }

    return this.mapToDto(updated);
  }

  private mapToDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentType: payment.paymentType,
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.createdAt,
    };
  }
}
