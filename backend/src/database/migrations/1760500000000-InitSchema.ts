import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Первая миграция: создаёт все таблицы.
 *
 * Пишем SQL руками (а не synchronize: true), потому что:
 *  - видно, что именно происходит с базой;
 *  - можно откатить: npm run migration:revert;
 *  - TypeORM не умеет генерировать EXCLUDE-ограничение (защита от двойной брони).
 *
 * Запуск: npm run migration:run
 */
export class InitSchema1760500000000 implements MigrationInterface {
  name = 'InitSchema1760500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // btree_gist нужен, чтобы в одном EXCLUDE-ограничении сравнивать
    // и id места (=), и пересечение интервалов времени (&&).
    await queryRunner.query(`
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE clubs (
  id                 varchar PRIMARY KEY,
  name               varchar NOT NULL,
  city               varchar NOT NULL,
  address            varchar NOT NULL,
  lat                numeric(9,6) NOT NULL,
  lng                numeric(9,6) NOT NULL,
  phone              varchar NOT NULL,
  open_time          varchar NOT NULL,
  close_time         varchar NOT NULL,
  is_24h             boolean NOT NULL DEFAULT false,
  photos             text[] NOT NULL DEFAULT '{}',
  description        text NOT NULL DEFAULT '',
  equipment          text[] NOT NULL DEFAULT '{}',
  base_rating        numeric(3,2) NOT NULL DEFAULT 0,
  base_reviews_count integer NOT NULL DEFAULT 0,
  rating             numeric(3,2) NOT NULL DEFAULT 0,
  reviews_count      integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         varchar NOT NULL UNIQUE,
  password_hash varchar NOT NULL,
  name          varchar NOT NULL,
  phone         varchar,
  role          varchar NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'club_admin')),
  club_id       varchar REFERENCES clubs(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE zones (
  id          varchar PRIMARY KEY,
  club_id     varchar NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name        varchar NOT NULL,
  type        varchar NOT NULL CHECK (type IN ('standard', 'vip', 'bootcamp', 'console')),
  pc_spec     jsonb,
  peripherals text[] NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_zones_club ON zones(club_id);

CREATE TABLE tariffs (
  id         varchar PRIMARY KEY,
  zone_id    varchar NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name       varchar NOT NULL,
  kind       varchar NOT NULL CHECK (kind IN ('hourly', 'package', 'night')),
  hours      integer CHECK (hours IS NULL OR hours > 0),
  price      integer NOT NULL CHECK (price >= 0),
  time_from  varchar,
  time_to    varchar,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_tariffs_zone ON tariffs(zone_id);

CREATE TABLE seats (
  id        varchar PRIMARY KEY,
  zone_id   varchar NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  number    integer NOT NULL CHECK (number > 0),
  x         integer NOT NULL DEFAULT 0,
  y         integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_seats_zone_number UNIQUE (zone_id, number)
);

CREATE TABLE bookings (
  id             varchar PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES users(id),
  club_id        varchar NOT NULL REFERENCES clubs(id),
  zone_id        varchar NOT NULL REFERENCES zones(id),
  tariff_id      varchar NOT NULL REFERENCES tariffs(id),
  date           date NOT NULL,
  start_time     varchar NOT NULL,
  hours          integer NOT NULL CHECK (hours > 0),
  starts_at      timestamptz NOT NULL,
  ends_at        timestamptz NOT NULL,
  total          integer NOT NULL CHECK (total >= 0),
  customer_name  varchar NOT NULL,
  customer_phone varchar NOT NULL,
  status         varchar NOT NULL DEFAULT 'pending_payment'
                 CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired')),
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz,
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_club_start ON bookings(club_id, starts_at);
CREATE INDEX idx_bookings_pending ON bookings(expires_at) WHERE status = 'pending_payment';

CREATE TABLE booking_seats (
  booking_id varchar NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id    varchar NOT NULL REFERENCES seats(id),
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  PRIMARY KEY (booking_id, seat_id),
  -- Защита от двойной брони на уровне базы: два АКТИВНЫХ интервала
  -- на одном месте не могут пересекаться ([) — конец не включён,
  -- поэтому 18:00–20:00 и 20:00–22:00 спокойно соседствуют).
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    seat_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (is_active)
);

CREATE TABLE payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  varchar NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount      integer NOT NULL CHECK (amount >= 0),
  provider    varchar NOT NULL,
  external_id varchar,
  status      varchar NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  paid_at     timestamptz,
  refunded_at timestamptz
);
CREATE INDEX idx_payments_booking ON payments(booking_id);

CREATE TABLE reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    varchar NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_reviews_club_user UNIQUE (club_id, user_id)
);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем в обратном порядке (сначала те, кто ссылается на других)
    await queryRunner.query(`
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS booking_seats;
      DROP TABLE IF EXISTS bookings;
      DROP TABLE IF EXISTS seats;
      DROP TABLE IF EXISTS tariffs;
      DROP TABLE IF EXISTS zones;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS clubs;
    `);
  }
}
