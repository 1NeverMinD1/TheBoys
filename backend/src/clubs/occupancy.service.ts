import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

/**
 * «Занятость мест» — единое место, где решается, занято ли место в интервале.
 *
 * Место занято, если на него есть АКТИВНАЯ запись в booking_seats,
 * пересекающаяся по времени, и сама бронь:
 *   - подтверждена (confirmed), или
 *   - ждёт оплаты и ещё не просрочена (expires_at в будущем).
 *
 * Вторая проверка нужна, потому что фоновая задача снимает просроченные брони
 * раз в несколько секунд — а отвечать правильно надо в любой момент.
 */
const ACTIVE_BOOKING_SQL = `
  bs.is_active
  AND (b.status = 'confirmed' OR (b.status = 'pending_payment' AND b.expires_at > now()))
`;

@Injectable()
export class OccupancyService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /**
   * Какие из мест seatIds заняты в интервале [from; to).
   * Интервалы пересекаются, если начало одного раньше конца другого и наоборот.
   */
  async busySeatIds(seatIds: string[], from: Date, to: Date, em: EntityManager = this.ds.manager) {
    if (seatIds.length === 0) return new Set<string>();
    const rows: { seat_id: string }[] = await em.query(
      `SELECT DISTINCT bs.seat_id
         FROM booking_seats bs
         JOIN bookings b ON b.id = bs.booking_id
        WHERE bs.seat_id = ANY($1)
          AND bs.starts_at < $3 AND bs.ends_at > $2
          AND ${ACTIVE_BOOKING_SQL}`,
      [seatIds, from, to],
    );
    return new Set(rows.map((r) => r.seat_id));
  }

  /** Сколько мест в каждой зоне всего и сколько занято ПРЯМО СЕЙЧАС */
  async zoneStats(zoneIds: string[]) {
    const stats = new Map<string, { total: number; busy: number }>();
    if (zoneIds.length === 0) return stats;

    const totals: { zone_id: string; total: string }[] = await this.ds.query(
      `SELECT zone_id, count(*) AS total FROM seats
        WHERE is_active AND zone_id = ANY($1) GROUP BY zone_id`,
      [zoneIds],
    );
    const busy: { zone_id: string; busy: string }[] = await this.ds.query(
      `SELECT s.zone_id, count(DISTINCT bs.seat_id) AS busy
         FROM booking_seats bs
         JOIN bookings b ON b.id = bs.booking_id
         JOIN seats s ON s.id = bs.seat_id
        WHERE s.is_active AND s.zone_id = ANY($1)
          AND bs.starts_at <= now() AND bs.ends_at > now()
          AND ${ACTIVE_BOOKING_SQL}
        GROUP BY s.zone_id`,
      [zoneIds],
    );

    for (const id of zoneIds) stats.set(id, { total: 0, busy: 0 });
    // count(*) в PostgreSQL возвращает bigint → драйвер отдаёт строку, переводим в число
    for (const r of totals) stats.get(r.zone_id)!.total = Number(r.total);
    for (const r of busy) stats.get(r.zone_id)!.busy = Number(r.busy);
    return stats;
  }
}
