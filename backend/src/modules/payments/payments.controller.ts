import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentHistoryDto,
  KaspiWebhookDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPayment(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, type: PaymentHistoryDto })
  async getHistory(
    @CurrentUser('id') userId: string,
  ): Promise<PaymentHistoryDto> {
    return this.paymentsService.getPaymentHistory(userId);
  }

  @Get('status/:id')
  @Public()
  @ApiOperation({ summary: 'Get payment status (public, for return URL)' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async getPaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentPublic(id);
  }

  @Get('sandbox/pay')
  @Public()
  @ApiOperation({ summary: 'Sandbox payment page (dev only)' })
  async sandboxPay(
    @Query('orderId') orderId: string,
    @Query('amount') amount: string,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kaspi Pay Sandbox</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
    .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 420px; width: 90%; }
    .logo { font-size: 2rem; font-weight: 700; color: #FF6900; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: #fff3e0; color: #e65100; padding: 2px 10px; border-radius: 4px; font-size: 12px; margin-bottom: 1.5rem; }
    .info { color: #666; margin-bottom: 0.5rem; font-size: 14px; }
    .amount { font-size: 2rem; font-weight: 700; color: #1a1a1a; margin: 1rem 0 1.5rem; }
    .amount span { font-size: 1rem; color: #888; }
    .btn { display: inline-block; width: 100%; background: #FF6900; color: white; border: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #e55f00; }
    .btn-cancel { background: #eee; color: #666; margin-top: 10px; }
    .btn-cancel:hover { background: #ddd; }
    .divider { border-top: 1px solid #eee; margin: 1.5rem 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Kaspi Pay</div>
    <div class="badge">SANDBOX MODE</div>
    <p class="info">Заказ: ${orderId}</p>
    <div class="amount">${Number(amount).toLocaleString('ru-RU')} <span>KZT</span></div>
    <button class="btn" onclick="pay('completed')">Оплатить</button>
    <div class="divider"></div>
    <button class="btn btn-cancel" onclick="pay('failed')">Отменить</button>
    <script>
      function pay(status) {
        fetch(window.location.origin + '/api/v1/payments/sandbox/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({orderId:'${orderId}',status:status,amount:'${amount}',signature:'sandbox'})
        }).then(r => r.json()).then(d => {
          if(d.redirectUrl) window.location.href = d.redirectUrl;
          else window.location.href = '${process.env.FRONTEND_URL || 'http://100.118.110.5:3400'}/payment/status?id=${orderId}';
        }).catch(() => {
          window.location.href = '${process.env.FRONTEND_URL || 'http://100.118.110.5:3400'}/payment/status?id=${orderId}';
        });
      }
    </script>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    return res.send(html);
  }

  @Post('sandbox/webhook')
  @Public()
  @ApiOperation({ summary: 'Sandbox webhook handler (dev only)' })
  async sandboxWebhook(
    @Body() body: { orderId: string; status: string; amount: string },
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const redirectUrl = await this.paymentsService.handleSandboxWebhook(
      body.orderId,
      body.status,
      body.amount,
    );

    return res.json({ success: true, redirectUrl });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPayment(id, userId);
  }

  @Post('webhook/kaspi')
  @Public()
  @ApiOperation({ summary: 'Kaspi Pay webhook endpoint' })
  async kaspiWebhook(@Body() dto: KaspiWebhookDto) {
    return this.paymentsService.handleKaspiWebhook(dto);
  }

  // Development endpoint to simulate payment completion
  @Post(':id/simulate-complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate payment completion (dev only)' })
  async simulateComplete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is not available in production');
    }
    return this.paymentsService.simulatePaymentComplete(id);
  }
}
