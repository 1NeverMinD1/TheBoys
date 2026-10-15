/**
 * «Контракт» платёжного провайдера. Любой реальный провайдер
 * (Kaspi Pay, CloudPayments, ioka, Freedom Pay...) реализует эти методы —
 * и остальной код вообще не меняется. Это паттерн «Стратегия».
 */
export interface PaymentProvider {
  readonly name: string;

  /** Создать платёж у провайдера → его id и ссылка на страницу оплаты */
  createPayment(input: {
    paymentId: string;
    amount: number;
    description: string;
  }): Promise<{ externalId: string; paymentUrl: string | null }>;

  /** Вернуть деньги */
  refund(externalId: string, amount: number): Promise<void>;

  /**
   * Разобрать уведомление (webhook) от провайдера. Обязательно проверять подпись!
   * null — если запрос не от провайдера или подпись неверна.
   */
  parseWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): { externalId: string; status: 'succeeded' | 'failed' } | null;
}

/** Токен для внедрения зависимости: @Inject(PAYMENT_PROVIDER) */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
