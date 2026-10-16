/**
 * Заполняет базу тестовыми данными: npm run seed
 *
 * ВНИМАНИЕ: перед заливкой ОЧИЩАЕТ все таблицы. Только для разработки!
 *
 * Что создаётся:
 *  - 4 клуба из моков фронта (зоны, тарифы, места со схемой зала);
 *  - игрок     player@theboys.kz / password123
 *  - админы    admin@<id-клуба>.kz / admin12345   (например admin@respawn-arena.kz)
 *  - «живая» загрузка: чтобы занятость была похожа на моки (seatsFree),
 *    на ближайшие 4 часа создаются подтверждённые брони от «Ресепшена».
 *  - у игрока есть вчерашняя подтверждённая бронь в Respawn Arena —
 *    значит, он может оставить там отзыв.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { generateBookingId } from '../../bookings/booking-id';
import { addHoursToDate, toAstanaDate, toAstanaTime } from '../../common/time/astana-time';
import { buildTypeOrmOptions } from '../typeorm.config';
import { seedClubs } from './clubs.data';

// Сколько мест в ряду на схеме зала (просто чтобы схема выглядела прилично)
const COLUMNS: Record<string, number> = { standard: 6, vip: 5, bootcamp: 5, console: 2 };

/** Заливает тестовые данные в уже подключённую базу (используется и в e2e-тестах) */
export async function runSeed(ds: DataSource, log: (msg: string) => void = console.log) {
  const q = (sql: string, params: unknown[] = []) => ds.query(sql, params);

  log('🧹 Очищаю таблицы...');
  await q(`TRUNCATE reviews, payments, booking_seats, bookings, seats, tariffs, zones, users, clubs CASCADE`);

  // --- Пользователи -------------------------------------------------------
  const playerHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin12345', 10);

  const [player] = await q(
    `INSERT INTO users (email, password_hash, name, phone, role)
     VALUES ('player@theboys.kz', $1, 'Тестовый Игрок', '+77001112233', 'player') RETURNING id`,
    [playerHash],
  );
  const [reception] = await q(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ('reception@theboys.kz', $1, 'Ресепшен (демо-загрузка)', 'player') RETURNING id`,
    [adminHash],
  );

  // Начало текущего часа — от него строим демо-брони
  const now = new Date();
  const hourStart = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);

  for (const club of seedClubs) {
    log(`🏠 ${club.name}`);
    await q(
      `INSERT INTO clubs (id, name, city, address, lat, lng, phone, open_time, close_time, is_24h,
                          photos, description, equipment, base_rating, base_reviews_count, rating, reviews_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$14,$15)`,
      [
        club.id, club.name, club.city, club.address, club.coords.lat, club.coords.lng, club.phone,
        club.workingHours.open, club.workingHours.close, club.workingHours.is24h,
        club.photos, club.description, club.equipment, club.rating, club.reviewsCount,
      ],
    );

    await q(
      `INSERT INTO users (email, password_hash, name, role, club_id)
       VALUES ($1, $2, $3, 'club_admin', $4)`,
      [`admin@${club.id}.kz`, adminHash, `Админ ${club.name}`, club.id],
    );

    for (const [zoneIndex, zone] of club.zones.entries()) {
      await q(
        `INSERT INTO zones (id, club_id, name, type, pc_spec, peripherals, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [zone.id, club.id, zone.name, zone.type, zone.pcSpec ? JSON.stringify(zone.pcSpec) : null, zone.peripherals, zoneIndex],
      );

      for (const [tariffIndex, t] of zone.tariffs.entries()) {
        await q(
          `INSERT INTO tariffs (id, zone_id, name, kind, hours, price, time_from, time_to, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [t.id, zone.id, t.name, t.kind, t.hours, t.price, t.timeFrom, t.timeTo, tariffIndex],
        );
      }

      // Места: id как в моках фронта — "<zoneId>-seat-<номер>"
      const cols = COLUMNS[zone.type] ?? 6;
      const seatIds: string[] = [];
      for (let n = 1; n <= zone.seatsTotal; n++) {
        const id = `${zone.id}-seat-${n}`;
        seatIds.push(id);
        await q(`INSERT INTO seats (id, zone_id, number, x, y) VALUES ($1,$2,$3,$4,$5)`, [
          id, zone.id, n, (n - 1) % cols, Math.floor((n - 1) / cols),
        ]);
      }

      // Демо-загрузка: занимаем (seatsTotal - seatsFree) мест через одно-два,
      // чтобы на схеме было видно вперемешку свободные и занятые
      const busyCount = zone.seatsTotal - zone.seatsFree;
      const hourly = zone.tariffs.find((t) => t.kind === 'hourly');
      if (busyCount > 0 && hourly) {
        const busySeats = pickSpread(seatIds, busyCount);
        const startsAt = hourStart;
        await insertBooking(q, {
          userId: reception.id, clubId: club.id, zoneId: zone.id, tariffId: hourly.id,
          startsAt, hours: 4, total: hourly.price * 4 * busySeats.length,
          name: 'Гость в зале', phone: '+70000000000', seatIds: busySeats,
        });
      }
    }
  }

  // Вчерашняя бронь игрока — даёт право оставить отзыв в Respawn Arena
  const yesterday = addHoursToDate(hourStart, -24);
  await insertBooking(q, {
    userId: player.id, clubId: 'respawn-arena', zoneId: 'respawn-standard', tariffId: 'r-s-1',
    startsAt: yesterday, hours: 2, total: 1600,
    name: 'Тестовый Игрок', phone: '+77001112233', seatIds: ['respawn-standard-seat-30'],
  });

  log('✅ Готово!');
  log('   Игрок:  player@theboys.kz / password123');
  log('   Админы: admin@<id клуба>.kz / admin12345 (например admin@respawn-arena.kz)');
}

/** Равномерно выбирает count элементов из массива (не подряд) */
function pickSpread<T>(items: T[], count: number): T[] {
  if (count >= items.length) return [...items];
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

async function insertBooking(
  q: (sql: string, params?: unknown[]) => Promise<any>,
  b: {
    userId: string; clubId: string; zoneId: string; tariffId: string;
    startsAt: Date; hours: number; total: number; name: string; phone: string; seatIds: string[];
  },
) {
  const id = generateBookingId();
  const endsAt = addHoursToDate(b.startsAt, b.hours);
  await q(
    `INSERT INTO bookings (id, user_id, club_id, zone_id, tariff_id, date, start_time, hours,
                           starts_at, ends_at, total, customer_name, customer_phone, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'confirmed')`,
    [id, b.userId, b.clubId, b.zoneId, b.tariffId, toAstanaDate(b.startsAt), toAstanaTime(b.startsAt),
     b.hours, b.startsAt, endsAt, b.total, b.name, b.phone],
  );
  for (const seatId of b.seatIds) {
    await q(`INSERT INTO booking_seats (booking_id, seat_id, starts_at, ends_at) VALUES ($1,$2,$3,$4)`, [
      id, seatId, b.startsAt, endsAt,
    ]);
  }
}

// Запуск как скрипта: npm run seed
if (require.main === module) {
  try {
    process.loadEnvFile('.env');
  } catch {
    /* без .env — значения по умолчанию */
  }
  (async () => {
    const ds = await new DataSource(buildTypeOrmOptions()).initialize();
    await runSeed(ds);
    await ds.destroy();
  })().catch((err) => {
    console.error('❌ Ошибка сидинга:', err);
    process.exit(1);
  });
}
