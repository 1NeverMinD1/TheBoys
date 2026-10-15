import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingSeat } from '../bookings/entities/booking-seat.entity';
import { badRequest, conflict, forbidden, notFound } from '../common/errors/app.exception';
import { User } from '../users/user.entity';
import { Payment } from './payment.entity';
import { PAYMENT_PROVIDER, PaymentProvider } from './providers/payment-provider.interface';
import { RefundService } from './refund.service';

/**
 * Сценарий оплаты:
 *  1. POST /payments { bookingId }  → создаём платёж, отдаём ссылку на оплату
 *  2. пользователь платит у провайдера
 *  3. провайдер шлёт webhook → POST /payments/webhook/:provider
 *     (у mock-провайдера вместо этого POST /payments/:id/mock-confirm)
 *  4. платёж succeeded → бронь confirmed
 *  Если оплата пришла, когда бронь уже просрочена, — деньги сразу возвращаем.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly bookings: BookingsService,
    private readonly refunds: RefundService,
  ) {}

  async create(user: User, bookingId: string) {
    const booking = await this.ds.manager.findOneBy(Booking, { id: bookingId });
    if (!booking || booking.userId !== user.id) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
    if (booking.status === 'confirmed') throw conflict('ALREADY_PAID', 'Бронь уже оплачена');
    if (booking.status !== 'pending_payment' || (booking.expiresAt && booking.expiresAt.getTime() <= Date.now())) {
      throw conflict('BOOKING_EXPIRED', 'Время на оплату истекло, бронь снята');
    }

    // Повторное нажатие «Оплатить» — отдаём уже созданный платёж, а не плодим новые
    const existing = await this.payments.findOneBy({ bookingId, status: 'pending' });
    if (existing) return this.toDto(existing, null);

    const payment = await this.payments.save(
      this.payments.create({ bookingId, amount: booking.total, provider: this.provider.name, status: 'pending' }),
    );
    const { externalId, paymentUrl } = await this.provider.createPayment({
      paymentId: payment.id,
      amount: payment.amount,
      description: `Бронь ${booking.id}`,
    });
    payment.externalId = externalId;
    await this.payments.save(payment);
    return this.toDto(payment, paymentUrl);
  }

  async findOne(user: User, id: string) {
    const payment = await this.payments.findOne({ where: { id }, relations: { booking: true } });
    if (!payment || payment.booking.userId !== user.id) throw notFound('PAYMENT_NOT_FOUND', 'Платёж не найден');
    return this.toDto(payment, null);
  }

  /** Только для тестового провайдера: «оплатить» без денег */
  async mockConfirm(user: User, id: string, success: boolean) {
    if (this.provider.name !== 'mock') throw forbidden('FORBIDDEN', 'Доступно только в тестовом режиме оплаты');
    const payment = await this.payments.findOne({ where: { id }, relations: { booking: true } });
    if (!payment || payment.booking.userId !== user.id) throw notFound('PAYMENT_NOT_FOUND', 'Платёж не найден');
    return success ? this.markSucceeded(payment.id) : this.markFailed(payment.id);
  }

  async handleWebhook(providerName: string, headers: Record<string, any>, body: unknown) {
    if (providerName !== this.provider.name) throw notFound('NOT_FOUND', 'Неизвестный провайдер');
    const event = this.provider.parseWebhook(headers, body);
    if (!event) throw badRequest('INVALID_WEBHOOK', 'Некорректное уведомление');

    const payment = await this.payments.findOneBy({ externalId: event.externalId, provider: providerName });
    if (!payment) throw notFound('PAYMENT_NOT_FOUND', 'Платёж не найден');
    if (event.status === 'succeeded') await this.markSucceeded(payment.id, { throwOnExpired: false });
    else await this.markFailed(payment.id);
    return { ok: true };
  }

  /** Платёж прошёл → подтверждаем бронь (или возвращаем деньги, если опоздали) */
  private async markSucceeded(paymentId: string, opts = { throwOnExpired: true }) {
    const outcome = await this.ds.transaction(async (em) => {
      const payment = await em.findOne(Payment, { where: { id: paymentId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw notFound('PAYMENT_NOT_FOUND', 'Платёж не найден');
      // Идемпотентность: провайдеры часто присылают одно уведомление несколько раз
      if (payment.status !== 'pending') return payment.status;

      const booking = await this.bookings.lockBooking(em, payment.bookingId);
      await em.update(Payment, payment.id, { status: 'succeeded', paidAt: new Date() });

      const stillHeld =
        booking.status === 'pending_payment' && booking.expiresAt !== null && booking.expiresAt.getTime() > Date.now();
      if (!stillHeld && booking.status !== 'confirmed') {
        // Опоздали: бронь снята, места могли уже занять — возвращаем деньги.
        // Также гасим места просроченной брони (если фоновая задача ещё не успела)
        await this.refunds.refundPayment(em, { ...payment, status: 'succeeded' });
        if (booking.status === 'pending_payment') {
          await em.update(Booking, booking.id, { status: 'expired' });
          await em.update(BookingSeat, { bookingId: booking.id }, { isActive: false });
        }
        return 'refunded' as const;
      }
      await this.bookings.confirmInTx(em, booking);
      return 'succeeded' as const;
    });

    if (outcome === 'refunded' && opts.throwOnExpired) {
      throw conflict('BOOKING_EXPIRED', 'Время на оплату истекло — деньги возвращены, забронируйте заново');
    }
    const payment = await this.payments.findOneByOrFail({ id: paymentId });
    return this.toDto(payment, null);
  }

  private async markFailed(paymentId: string) {
    await this.payments.update({ id: paymentId, status: 'pending' }, { status: 'failed' });
    return this.toDto(await this.payments.findOneByOrFail({ id: paymentId }), null);
  }

  private toDto(p: Payment, paymentUrl: string | null) {
    return {
      id: p.id,
      bookingId: p.bookingId,
      amount: p.amount,
      provider: p.provider,
      status: p.status,
      paymentUrl,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    };
  }
}
