/**
 * Сквозные (e2e) тесты: поднимаем настоящее приложение и настоящую базу
 * и гоняем HTTP-запросы, как это делал бы фронт.
 *
 * Нужна отдельная тестовая база (её содержимое затирается!):
 *   createdb theboys_test   (или через docker: см. README)
 *   npm run test:e2e
 */
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'theboys_test';
process.env.JWT_SECRET = 'test-secret';
process.env.PAYMENT_PROVIDER = 'mock';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { BookingExpiryService } from '../src/bookings/booking-expiry.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { toAstanaDate } from '../src/common/time/astana-time';
import { runSeed } from '../src/database/seeds/seed';

describe('The Boys API (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let http: ReturnType<typeof request>;

  // Завтрашняя дата по Астане — на неё нет демо-броней
  const tomorrow = toAstanaDate(new Date(Date.now() + 24 * 3_600_000));
  const dayAfter = toAstanaDate(new Date(Date.now() + 48 * 3_600_000));

  const login = async (email: string, password: string) =>
    (await http.post('/auth/login').send({ email, password }).expect(200)).body.accessToken as string;

  const register = async (email: string) =>
    (await http.post('/auth/register').send({ email, password: 'password123', name: 'Тест' }).expect(201)).body
      .accessToken as string;

  const booking = (over: Record<string, unknown> = {}) => ({
    clubId: 'respawn-arena',
    zoneId: 'respawn-standard',
    seatIds: ['respawn-standard-seat-1'],
    date: tomorrow,
    startTime: '15:00',
    tariffId: 'r-s-1',
    hours: 2,
    total: 1600,
    customerName: 'Батыр',
    customerPhone: '+7 700 123 45 67',
    ...over,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    ds = app.get(DataSource);
    await ds.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await ds.runMigrations();
    await runSeed(ds, () => undefined);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('клубы', () => {
    it('GET /clubs — 4 клуба в формате ClubSummary, по рейтингу', async () => {
      const { body } = await http.get('/clubs').expect(200);
      expect(body).toHaveLength(4);
      expect(body[0].id).toBe('noscope-club'); // 4.9 — самый высокий
      expect(Object.keys(body[0]).sort()).toEqual(
        [
          'id', 'name', 'city', 'address', 'coords', 'photo', 'rating', 'reviewsCount', 'is24h',
          'minPricePerHour', 'seatsFree', 'seatsTotal', 'zoneTypes', 'topGpu', 'maxRefreshRateHz',
        ].sort(),
      );
      const respawn = body.find((c: any) => c.id === 'respawn-arena');
      expect(respawn).toMatchObject({
        minPricePerHour: 800,
        seatsTotal: 45,
        seatsFree: 20, // 12 + 3 + 5, как в моках
        topGpu: 'RTX 4080 Super',
        maxRefreshRateHz: 380,
        is24h: true,
      });
    });

    it('фильтры как в URL фронта', async () => {
      expect((await http.get('/clubs?zones=bootcamp').expect(200)).body.map((c: any) => c.id)).toEqual(['respawn-arena']);
      expect((await http.get('/clubs?24h=1').expect(200)).body).toHaveLength(2);
      expect((await http.get('/clubs?sort=price-asc').expect(200)).body[0].id).toBe('ctrl-play');
      expect((await http.get('/clubs?free=1').expect(200)).body).toHaveLength(4);
      expect((await http.get('/clubs?minHz=360&maxPrice=1000').expect(200)).body.map((c: any) => c.id)).toEqual([
        'respawn-arena',
      ]);
      expect((await http.get('/clubs?q=кенесары').expect(200)).body[0].id).toBe('pixel-hub');
    });

    it('GET /clubs/:id — клуб целиком', async () => {
      const { body } = await http.get('/clubs/respawn-arena').expect(200);
      expect(body.zones).toHaveLength(3);
      expect(body.zones[0]).toMatchObject({ id: 'respawn-standard', seatsTotal: 30, seatsFree: 12 });
      expect(body.zones[0].tariffs[2]).toEqual({
        id: 'r-s-n', name: 'Ночь', kind: 'night', hours: 8, price: 3500, timeFrom: '23:00', timeTo: '07:00',
      });
      expect(body.workingHours).toEqual({ open: '00:00', close: '23:59', is24h: true });
    });

    it('ошибки в формате { message, code }', async () => {
      const { body } = await http.get('/clubs/nope').expect(404);
      expect(body).toEqual({ message: 'Клуб не найден', code: 'CLUB_NOT_FOUND' });
      const v = await http.get('/clubs?zones=spaceship').expect(400);
      expect(v.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('авторизация', () => {
    it('регистрация, вход, /auth/me', async () => {
      const reg = await http
        .post('/auth/register')
        .send({ email: 'New@Mail.kz', password: 'password123', name: 'Новичок', phone: '87001234567' })
        .expect(201);
      expect(reg.body.user).toMatchObject({ email: 'new@mail.kz', role: 'player', phone: '+77001234567' });
      expect(reg.body.user.passwordHash).toBeUndefined();

      await http.post('/auth/register').send({ email: 'new@mail.kz', password: 'password123', name: 'X' }).expect(409);
      const bad = await http.post('/auth/login').send({ email: 'new@mail.kz', password: 'wrong-pass' }).expect(401);
      expect(bad.body.code).toBe('INVALID_CREDENTIALS');

      const token = await login('new@mail.kz', 'password123');
      const me = await http.get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
      expect(me.body.name).toBe('Новичок');

      await http.get('/auth/me').expect(401);
      await http.get('/auth/me').set('Authorization', 'Bearer garbage').expect(401);
    });
  });

  describe('места и брони', () => {
    let token: string;
    let other: string;
    beforeAll(async () => {
      token = await register('booker@test.kz');
      other = await register('other@test.kz');
    });

    it('сейчас заняты места демо-загрузки, завтра всё свободно', async () => {
      const now = new Date();
      const today = toAstanaDate(now);
      const hour = String((now.getUTCHours() + 5) % 24).padStart(2, '0');
      const nowSeats = (await http.get(`/clubs/respawn-arena/zones/respawn-standard/seats?date=${today}&startTime=${hour}:00`).expect(200)).body;
      expect(nowSeats).toHaveLength(30);
      expect(nowSeats.filter((s: any) => !s.isFree)).toHaveLength(18);

      const tmr = (await http.get(`/clubs/respawn-arena/zones/respawn-standard/seats?date=${tomorrow}&startTime=15:00`).expect(200)).body;
      expect(tmr.every((s: any) => s.isFree)).toBe(true);
      expect(tmr[0]).toMatchObject({ id: 'respawn-standard-seat-1', number: 1, isFree: true });
    });

    it('нужен вход', async () => {
      await http.post('/bookings').send(booking()).expect(401);
    });

    it('создание брони: сумма с сервера, место занимается', async () => {
      const { body } = await http.post('/bookings').set('Authorization', `Bearer ${token}`).send(booking()).expect(201);
      expect(body).toMatchObject({
        status: 'pending_payment', total: 1600, hours: 2, seatIds: ['respawn-standard-seat-1'],
        customerPhone: '+77001234567', clubName: 'Respawn Arena',
      });
      expect(body.id).toMatch(/^GC-[A-Z0-9]{8}$/);
      expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);

      const seats = (await http.get(`/clubs/respawn-arena/zones/respawn-standard/seats?date=${tomorrow}&startTime=16:00`).expect(200)).body;
      expect(seats[0].isFree).toBe(false);
      // 17:00 — бронь 15:00–17:00 уже закончилась, конец интервала не включён
      const later = (await http.get(`/clubs/respawn-arena/zones/respawn-standard/seats?date=${tomorrow}&startTime=17:00`).expect(200)).body;
      expect(later[0].isFree).toBe(true);
    });

    it('двойная бронь того же места → 409 SEAT_TAKEN', async () => {
      const { body } = await http
        .post('/bookings').set('Authorization', `Bearer ${other}`)
        .send(booking({ startTime: '16:00', total: undefined })).expect(409);
      expect(body.code).toBe('SEAT_TAKEN');
      expect(body.message).toContain('№1');
    });

    it('гонка: 5 одновременных запросов на одно место — проходит ровно один', async () => {
      const users = await Promise.all([1, 2, 3, 4, 5].map((i) => register(`race${i}@test.kz`)));
      const results = await Promise.all(
        users.map((t) =>
          http.post('/bookings').set('Authorization', `Bearer ${t}`)
            .send(booking({ seatIds: ['respawn-standard-seat-2'], date: dayAfter })),
        ),
      );
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409]);
    });

    it('сумма не совпала → 409 PRICE_CHANGED; клиентскую сумму не принимаем', async () => {
      const { body } = await http.post('/bookings').set('Authorization', `Bearer ${token}`)
        .send(booking({ seatIds: ['respawn-standard-seat-3'], total: 1 })).expect(409);
      expect(body.code).toBe('PRICE_CHANGED');
    });

    it('проверки: ночь в своё время, часы работы, прошлое, чужое место', async () => {
      const auth = { Authorization: `Bearer ${token}` };
      const night = await http.post('/bookings').set(auth)
        .send(booking({ tariffId: 'r-s-n', startTime: '20:00', total: undefined, seatIds: ['respawn-standard-seat-4'] })).expect(400);
      expect(night.body.code).toBe('NIGHT_FIXED_TIME');

      // Pixel Hub работает 10:00–04:00: 08:00 нельзя, 02:00 (2 часа) можно
      const closed = await http.post('/bookings').set(auth).send(booking({
        clubId: 'pixel-hub', zoneId: 'pixel-standard', tariffId: 'p-s-1', seatIds: ['pixel-standard-seat-1'],
        startTime: '08:00', total: undefined,
      })).expect(400);
      expect(closed.body.code).toBe('CLUB_CLOSED');

      const past = await http.post('/bookings').set(auth).send(booking({ date: '2020-01-01', total: undefined })).expect(400);
      expect(past.body.code).toBe('TIME_IN_PAST');

      const alien = await http.post('/bookings').set(auth)
        .send(booking({ seatIds: ['respawn-vip-seat-1'], total: undefined })).expect(400);
      expect(alien.body.code).toBe('SEAT_NOT_FOUND');
    });

    it('буткемп бронируется целиком, цена за комнату', async () => {
      const { body } = await http.post('/bookings').set('Authorization', `Bearer ${other}`).send(booking({
        zoneId: 'respawn-bootcamp', tariffId: 'r-b-n', startTime: '23:00', hours: 8,
        seatIds: ['respawn-bootcamp-seat-1'], total: 30000,
      })).expect(201);
      expect(body.seatIds).toHaveLength(5);
      // 23:00 + 8 часов = 07:00 следующего дня
      expect(new Date(body.endsAt).getTime() - new Date(body.startsAt).getTime()).toBe(8 * 3_600_000);
      expect(body.total).toBe(30000);
    });

    it('удержание: через 10 минут без оплаты бронь снимается', async () => {
      const { body } = await http.post('/bookings').set('Authorization', `Bearer ${other}`)
        .send(booking({ seatIds: ['respawn-standard-seat-10'], total: undefined })).expect(201);
      // «Перематываем время»: делаем вид, что 10 минут прошли
      await ds.query(`UPDATE bookings SET expires_at = now() - interval '1 second' WHERE id = $1`, [body.id]);

      // Даже до фоновой задачи место уже считается свободным
      const seats = (await http.get(`/clubs/respawn-arena/zones/respawn-standard/seats?date=${tomorrow}&startTime=15:00`).expect(200)).body;
      expect(seats.find((s: any) => s.number === 10).isFree).toBe(true);

      await app.get(BookingExpiryService).expireStale(); // то, что фоновая задача делает раз в 15 секунд
      const after = await http.get(`/bookings/${body.id}`).set('Authorization', `Bearer ${other}`).expect(200);
      expect(after.body).toMatchObject({ status: 'expired', expiresAt: null });

      // Место можно снова забронировать
      await http.post('/bookings').set('Authorization', `Bearer ${token}`)
        .send(booking({ seatIds: ['respawn-standard-seat-10'], total: undefined })).expect(201);
    });

    it('GET /bookings/my и отмена', async () => {
      const my = (await http.get('/bookings/my').set('Authorization', `Bearer ${token}`).expect(200)).body;
      expect(my.length).toBeGreaterThanOrEqual(2);
      const target = my.find((b: any) => b.seatIds.includes('respawn-standard-seat-10'));

      // чужую бронь не видно и не отменить
      await http.post(`/bookings/${target.id}/cancel`).set('Authorization', `Bearer ${other}`).expect(404);

      const cancelled = await http.post(`/bookings/${target.id}/cancel`).set('Authorization', `Bearer ${token}`).expect(200);
      expect(cancelled.body.status).toBe('cancelled');
      await http.post(`/bookings/${target.id}/cancel`).set('Authorization', `Bearer ${token}`).expect(409);
    });

    it('лимит неоплаченных броней', async () => {
      const t = await register('greedy@test.kz');
      for (let i = 0; i < 3; i++) {
        await http.post('/bookings').set('Authorization', `Bearer ${t}`)
          .send(booking({ seatIds: [`respawn-standard-seat-${20 + i}`], total: undefined })).expect(201);
      }
      const res = await http.post('/bookings').set('Authorization', `Bearer ${t}`)
        .send(booking({ seatIds: ['respawn-standard-seat-25'], total: undefined })).expect(429);
      expect(res.body.code).toBe('TOO_MANY_PENDING');
    });
  });

  describe('оплата', () => {
    it('оплата подтверждает бронь, отмена возвращает деньги', async () => {
      const t = await register('payer@test.kz');
      const auth = { Authorization: `Bearer ${t}` };
      const b = (await http.post('/bookings').set(auth).send(booking({
        zoneId: 'respawn-vip', tariffId: 'r-v-3', seatIds: ['respawn-vip-seat-1', 'respawn-vip-seat-2'], hours: 3, total: 8000,
      })).expect(201)).body;

      const p = (await http.post('/payments').set(auth).send({ bookingId: b.id }).expect(201)).body;
      expect(p).toMatchObject({ amount: 8000, status: 'pending', provider: 'mock' });
      // повторное «Оплатить» — тот же платёж
      expect((await http.post('/payments').set(auth).send({ bookingId: b.id }).expect(201)).body.id).toBe(p.id);

      const paid = await http.post(`/payments/${p.id}/mock-confirm`).set(auth).expect(200);
      expect(paid.body.status).toBe('succeeded');
      // повторное уведомление ничего не ломает (идемпотентность)
      await http.post(`/payments/${p.id}/mock-confirm`).set(auth).expect(200);

      const confirmed = (await http.get(`/bookings/${b.id}`).set(auth).expect(200)).body;
      expect(confirmed).toMatchObject({ status: 'confirmed', expiresAt: null });

      await http.post(`/bookings/${b.id}/cancel`).set(auth).expect(200);
      expect((await http.get(`/payments/${p.id}`).set(auth).expect(200)).body.status).toBe('refunded');
    });

    it('оплата после истечения брони → деньги возвращаются', async () => {
      const t = await register('late@test.kz');
      const auth = { Authorization: `Bearer ${t}` };
      const b = (await http.post('/bookings').set(auth)
        .send(booking({ seatIds: ['respawn-standard-seat-15'], total: undefined })).expect(201)).body;
      const p = (await http.post('/payments').set(auth).send({ bookingId: b.id }).expect(201)).body;
      await ds.query(`UPDATE bookings SET expires_at = now() - interval '1 second' WHERE id = $1`, [b.id]);

      const res = await http.post(`/payments/${p.id}/mock-confirm`).set(auth).expect(409);
      expect(res.body.code).toBe('BOOKING_EXPIRED');
      expect((await http.get(`/payments/${p.id}`).set(auth).expect(200)).body.status).toBe('refunded');
      expect((await http.get(`/bookings/${b.id}`).set(auth).expect(200)).body.status).toBe('expired');
    });
  });

  describe('отзывы', () => {
    it('отзыв только после посещения, рейтинг пересчитывается', async () => {
      const stranger = await register('stranger@test.kz');
      const denied = await http.post('/clubs/respawn-arena/reviews').set('Authorization', `Bearer ${stranger}`)
        .send({ rating: 1 }).expect(403);
      expect(denied.body.code).toBe('NOT_VISITED');

      const player = await login('player@theboys.kz', 'password123');
      const auth = { Authorization: `Bearer ${player}` };
      const r = await http.post('/clubs/respawn-arena/reviews').set(auth).send({ rating: 1, text: '  Шумно  ' }).expect(201);
      expect(r.body).toMatchObject({ rating: 1, text: 'Шумно', author: { name: 'Тестовый Игрок' } });

      // (4.8 × 214 + 1) / 215 = 4.78 → 4.8; число отзывов 215
      let club = (await http.get('/clubs/respawn-arena').expect(200)).body;
      expect(club).toMatchObject({ rating: 4.8, reviewsCount: 215 });

      await http.post('/clubs/respawn-arena/reviews').set(auth).send({ rating: 5 }).expect(409);
      expect((await http.get('/clubs/respawn-arena/reviews').expect(200)).body).toHaveLength(1);

      await http.delete('/clubs/respawn-arena/reviews/my').set(auth).expect(204);
      club = (await http.get('/clubs/respawn-arena').expect(200)).body;
      expect(club).toMatchObject({ rating: 4.8, reviewsCount: 214 });
    });
  });

  describe('кабинет клуба', () => {
    let admin: string;
    beforeAll(async () => {
      admin = await login('admin@respawn-arena.kz', 'admin12345');
    });

    it('доступ только своему админу', async () => {
      const player = await login('player@theboys.kz', 'password123');
      await http.get('/admin/clubs').set('Authorization', `Bearer ${player}`).expect(403);
      const other = await http.patch('/admin/clubs/pixel-hub').set('Authorization', `Bearer ${admin}`).send({ name: 'X' }).expect(403);
      expect(other.body.code).toBe('NOT_YOUR_CLUB');
      const mine = (await http.get('/admin/clubs').set('Authorization', `Bearer ${admin}`).expect(200)).body;
      expect(mine.map((c: any) => c.id)).toEqual(['respawn-arena']);
    });

    it('редактирование клуба, зон, тарифов', async () => {
      const auth = { Authorization: `Bearer ${admin}` };
      let club = (await http.patch('/admin/clubs/respawn-arena').set(auth)
        .send({ description: 'Новое описание', workingHours: { open: '09:00', close: '03:00', is24h: false } }).expect(200)).body;
      expect(club).toMatchObject({ description: 'Новое описание', workingHours: { open: '09:00', close: '03:00', is24h: false } });

      club = (await http.patch('/admin/clubs/respawn-arena/zones/respawn-standard/tariffs/r-s-1').set(auth)
        .send({ price: 900 }).expect(200)).body;
      expect(club.zones[0].tariffs[0].price).toBe(900);

      club = (await http.post('/admin/clubs/respawn-arena/zones').set(auth)
        .send({ name: 'Консоли', type: 'console', pcSpec: null, peripherals: ['PS5'], seatsCount: 3 }).expect(201)).body;
      const consoleZone = club.zones.find((z: any) => z.type === 'console');
      expect(consoleZone).toMatchObject({ seatsTotal: 3, seatsFree: 3 });

      club = (await http.post(`/admin/clubs/respawn-arena/zones/${consoleZone.id}/tariffs`).set(auth)
        .send({ name: 'Ночь', kind: 'night', hours: 8, price: 5000, timeFrom: '23:00', timeTo: '07:00' }).expect(201)).body;
      expect(club.zones.find((z: any) => z.id === consoleZone.id).tariffs).toHaveLength(1);

      const noHours = await http.post(`/admin/clubs/respawn-arena/zones/${consoleZone.id}/tariffs`).set(auth)
        .send({ name: 'Пакет', kind: 'package', price: 100 }).expect(400);
      expect(noHours.body.code).toBe('VALIDATION_ERROR');

      club = (await http.delete(`/admin/clubs/respawn-arena/zones/${consoleZone.id}`).set(auth).expect(200)).body;
      expect(club.zones.find((z: any) => z.id === consoleZone.id)).toBeUndefined();

      // Каталог видит изменения
      const summary = (await http.get('/clubs').expect(200)).body.find((c: any) => c.id === 'respawn-arena');
      expect(summary.minPricePerHour).toBe(900);
      expect(summary.is24h).toBe(false);
      await http.patch('/admin/clubs/respawn-arena').set(auth).send({ workingHours: { open: '00:00', close: '23:59', is24h: true } }).expect(200);
    });

    it('схема зала', async () => {
      const auth = { Authorization: `Bearer ${admin}` };
      const layout = (await http.get('/admin/clubs/respawn-arena/zones/respawn-vip/layout').set(auth).expect(200)).body;
      expect(layout.seats).toHaveLength(10);

      // Места 1 и 2 сейчас заняты демо-загрузкой — убрать их нельзя
      const busy = await http.put('/admin/clubs/respawn-arena/zones/respawn-vip/layout').set(auth)
        .send({ seats: [{ number: 5, x: 0, y: 0 }] }).expect(409);
      expect(busy.body.code).toBe('SEAT_HAS_BOOKINGS');

      const seats = layout.seats.map((s: any) => ({ number: s.number, x: s.x, y: s.y + 1 }));
      seats.push({ number: 11, x: 4, y: 0 });
      const updated = (await http.put('/admin/clubs/respawn-arena/zones/respawn-vip/layout').set(auth).send({ seats }).expect(200)).body;
      expect(updated.seats).toHaveLength(11);
      expect(updated.seats[10]).toMatchObject({ id: 'respawn-vip-seat-11', number: 11, x: 4, y: 0 });

      const dup = await http.put('/admin/clubs/respawn-arena/zones/respawn-vip/layout').set(auth)
        .send({ seats: [{ number: 1, x: 0, y: 0 }, { number: 1, x: 1, y: 0 }] }).expect(400);
      expect(dup.body.code).toBe('DUPLICATE_SEAT');
    });

    it('брони клуба: список, подтверждение на кассе, отмена', async () => {
      const auth = { Authorization: `Bearer ${admin}` };
      const list = (await http.get(`/admin/clubs/respawn-arena/bookings?date=${tomorrow}&status=pending_payment`).set(auth).expect(200)).body;
      expect(list.length).toBeGreaterThan(0);
      const target = list[0];

      const confirmed = (await http.post(`/admin/clubs/respawn-arena/bookings/${target.id}/confirm`).set(auth).expect(200)).body;
      expect(confirmed.status).toBe('confirmed');
      const cancelled = (await http.post(`/admin/clubs/respawn-arena/bookings/${target.id}/cancel`).set(auth).expect(200)).body;
      expect(cancelled.status).toBe('cancelled');
    });
  });
});
