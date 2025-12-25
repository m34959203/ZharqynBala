import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentType, PaymentProvider } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'ID of test, consultation, or subscription' })
  @IsUUID()
  relatedId: string;

  @ApiPropertyOptional({ enum: PaymentProvider, default: 'KASPI' })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiPropertyOptional()
  paymentUrl?: string;

  @ApiProperty()
  createdAt: Date;
}

export class PaymentHistoryDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  payments: PaymentResponseDto[];

  @ApiProperty()
  total: number;
}

export class KaspiWebhookDto {
  @ApiProperty()
  @IsString()
  txn_id: string;

  @ApiProperty()
  @IsString()
  account: string;

  @ApiProperty()
  @IsNumber()
  sum: number;

  @ApiProperty()
  @IsString()
  command: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  txn_date?: string;
}
