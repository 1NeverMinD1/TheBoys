import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentProvider } from './payment-provider.interface';

/**
 * Тестовый провайдер: денег не списывает, ссылку на оплату не даёт.
 * «Оплатить» можно запросом POST /payments/:id/mock-confirm.
 * Нужен, чтобы фронт и весь сценарий брони работали до подключения реального эквайринга.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockPayments');

  async createPayment(input: { paymentId: string; amount: number }) {
    this.logger.log(`Создан тестовый платёж ${input.paymentId} на ${input.amount} ₸`);
    return { externalId: `mock_${randomUUID()}`, paymentUrl: null };
  }

  async refund(externalId: string, amount: number) {
    this.logger.log(`Тестовый возврат ${amount} ₸ по платежу ${externalId}`);
  }

  parseWebhook() {
    return null; // у тестового провайдера вебхуков нет
  }
}
