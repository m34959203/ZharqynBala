import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentType, PaymentProvider, PaymentStatus } from '@prisma/client';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentHistoryDto,
  KaspiWebhookDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
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
          status: PaymentStatus.COMPLETED,
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
        status: PaymentStatus.PENDING,
      },
    });

    // Generate payment URL (mock for now)
    const paymentUrl = this.generatePaymentUrl(payment.id, amount);

    return {
      ...this.mapToDto(payment),
      paymentUrl,
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
          status: PaymentStatus.COMPLETED,
          externalId: dto.txn_id,
          completedAt: new Date(),
        },
      });

      return { result: 0 };
    }

    return { result: 0 };
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
        status: PaymentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return this.mapToDto(updated);
  }

  private generatePaymentUrl(paymentId: string, amount: number): string {
    // In production, this would generate a real Kaspi Pay URL
    // For now, return a mock URL
    const baseUrl = this.configService.get('KASPI_PAYMENT_URL') ||
      'https://pay.kaspi.kz/pay';

    return `${baseUrl}?merchant=${this.configService.get('KASPI_MERCHANT_ID') || 'demo'}&order=${paymentId}&amount=${amount}`;
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
