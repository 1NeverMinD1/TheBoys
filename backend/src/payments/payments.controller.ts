import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Начать оплату брони → { id, status, paymentUrl, ... } */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreatePaymentDto) {
    return this.payments.create(user, dto.bookingId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.payments.findOne(user, id);
  }

  /** Тестовая оплата (PAYMENT_PROVIDER=mock). ?success=0 — имитировать отказ банка */
  @Post(':id/mock-confirm')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mockConfirm(@CurrentUser() user: User, @Param('id') id: string, @Query('success') success?: string) {
    return this.payments.mockConfirm(user, id, success !== '0' && success !== 'false');
  }

  /** Уведомления от платёжного провайдера (без JWT — провайдер подписывает запрос сам) */
  @Post('webhook/:provider')
  @HttpCode(200)
  webhook(@Param('provider') provider: string, @Headers() headers: Record<string, any>, @Body() body: unknown) {
    return this.payments.handleWebhook(provider, headers, body);
  }
}
