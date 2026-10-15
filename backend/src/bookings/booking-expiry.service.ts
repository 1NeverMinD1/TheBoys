import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

/**
 * Удержание места: неоплаченная бронь живёт BOOKING_HOLD_MINUTES минут
 * (по умолчанию 10), потом автоматически становится expired и освобождает места.
 *
 * Работает в два слоя:
 *  1. Фоновая задача раз в 15 секунд снимает просроченные брони (@Interval).
 *  2. Перед созданием новой брони тот же метод вызывается внутри транзакции —
 *     так место освобождается мгновенно, не дожидаясь фоновой задачи.
 */
@Injectable()
export class BookingExpiryService {
  private readonly logger = new Logger(BookingExpiryService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Interval(15_000)
  async handleInterval() {
    try {
      const count = await this.expireStale();
      if (count > 0) this.logger.log(`Снято просроченных броней: ${count}`);
    } catch (err) {
      this.logger.error('Не удалось снять просроченные брони', err as Error);
    }
  }

  /** Возвращает, сколько броней перевели в expired */
  async expireStale(em: EntityManager = this.ds.manager): Promise<number> {
    // Одним запросом (CTE): помечаем брони expired и сразу деактивируем их места
    const rows: { id: string }[] = await em.query(`
      WITH expired AS (
        UPDATE bookings SET status = 'expired'
         WHERE status = 'pending_payment' AND expires_at <= now()
        RETURNING id
      ), freed AS (
        UPDATE booking_seats SET is_active = false
         WHERE booking_id IN (SELECT id FROM expired)
      )
      SELECT id FROM expired
    `);
    return rows.length;
  }
}
