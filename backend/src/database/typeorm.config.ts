import type { DataSourceOptions } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingSeat } from '../bookings/entities/booking-seat.entity';
import { Club } from '../clubs/entities/club.entity';
import { Seat } from '../clubs/entities/seat.entity';
import { Tariff } from '../clubs/entities/tariff.entity';
import { Zone } from '../clubs/entities/zone.entity';
import { Payment } from '../payments/payment.entity';
import { Review } from '../reviews/review.entity';
import { User } from '../users/user.entity';
import { InitSchema1760500000000 } from './migrations/1760500000000-InitSchema';

export const ENTITIES = [User, Club, Zone, Tariff, Seat, Booking, BookingSeat, Payment, Review];

/**
 * Общие настройки подключения к базе. Используются в двух местах:
 *  - в приложении (AppModule)
 *  - в CLI для миграций и сидов (data-source.ts)
 */
export function buildTypeOrmOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'theboys',
    password: env.DB_PASSWORD ?? 'theboys',
    database: env.DB_NAME ?? 'theboys',
    entities: ENTITIES,
    migrations: [InitSchema1760500000000],
    // НИКОГДА не включаем synchronize: схему меняем только миграциями
    synchronize: false,
  };
}
