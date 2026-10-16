import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Payment } from './payment.entity';
import { PAYMENT_PROVIDER, PaymentProvider } from './providers/payment-provider.interface';

/**
 * Возвраты вынесены в отдельный сервис, чтобы модуль броней мог вызывать их
 * при отмене, не завися от всего модуля оплаты (иначе была бы циклическая зависимость:
 * оплата → брони → оплата).
 */
@Injectable()
export class RefundService {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  async refundForBooking(em: EntityManager, bookingId: string) {
    const paid = await em.findBy(Payment, { bookingId, status: 'succeeded' });
    for (const p of paid) await this.refundPayment(em, p);
  }

  async refundPayment(em: EntityManager, payment: Payment) {
    if (payment.externalId) await this.provider.refund(payment.externalId, payment.amount);
    await em.update(Payment, payment.id, { status: 'refunded', refundedAt: new Date() });
  }
}
