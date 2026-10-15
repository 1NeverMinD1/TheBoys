import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { normalizePhone } from '../auth/auth.service';
import { Club } from '../clubs/entities/club.entity';
import { Seat } from '../clubs/entities/seat.entity';
import { Tariff } from '../clubs/entities/tariff.entity';
import { Zone } from '../clubs/entities/zone.entity';
import { OccupancyService } from '../clubs/occupancy.service';
import { AppException, badRequest, conflict, notFound } from '../common/errors/app.exception';
import { addHoursToDate, fitsWorkingHours, toInstant } from '../common/time/astana-time';
import { User } from '../users/user.entity';
import { BookingExpiryService } from './booking-expiry.service';
import { generateBookingId } from './booking-id';
import { BOOKING_RELATIONS, toBookingDto } from './booking.mapper';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingSeat } from './entities/booking-seat.entity';
import { Booking } from './entities/booking.entity';

const MAX_DAYS_AHEAD = 30;
const MAX_PENDING_PER_USER = 3;
const PG_EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class BookingsService {
  private readonly holdMinutes: number;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly occupancy: OccupancyService,
    private readonly expiry: BookingExpiryService,
    config: ConfigService,
  ) {
    this.holdMinutes = Number(config.get('BOOKING_HOLD_MINUTES', 10));
  }

  /**
   * Создание брони. Всё происходит в ОДНОЙ транзакции:
   * либо бронь создана целиком (запись + все места), либо ничего не изменилось.
   */
  async create(user: User, dto: CreateBookingDto) {
    try {
      const id = await this.ds.transaction((em) => this.createInTx(em, user, dto));
      return this.findOneForUser(user, id);
    } catch (err: any) {
      // Последний рубеж: если два запроса всё-таки проскочили проверку
      // одновременно, база не даст записать второй (ограничение no_double_booking)
      if (err?.code === PG_EXCLUSION_VIOLATION || err?.driverError?.code === PG_EXCLUSION_VIOLATION) {
        throw conflict('SEAT_TAKEN', 'Кто-то только что занял одно из выбранных мест. Выберите другие');
      }
      throw err;
    }
  }

  private async createInTx(em: EntityManager, user: User, dto: CreateBookingDto): Promise<string> {
    // 0. Сначала освобождаем места просроченных неоплаченных броней
    await this.expiry.expireStale(em);

    // 1. Клуб, зона, тариф — существуют и связаны между собой
    const club = await em.findOneBy(Club, { id: dto.clubId });
    if (!club) throw notFound('CLUB_NOT_FOUND', 'Клуб не найден');

    const zone = await em.findOneBy(Zone, { id: dto.zoneId, clubId: club.id, isActive: true });
    if (!zone) throw notFound('ZONE_NOT_FOUND', 'Зона не найдена');

    const tariff = await em.findOneBy(Tariff, { id: dto.tariffId, zoneId: zone.id, isActive: true });
    if (!tariff) throw notFound('TARIFF_NOT_FOUND', 'Тариф не найден');

    // 2. Не даём одному человеку держать кучу неоплаченных броней
    const pending = await em.countBy(Booking, { userId: user.id, status: 'pending_payment' });
    if (pending >= MAX_PENDING_PER_USER) {
      throw new AppException(
        'TOO_MANY_PENDING',
        'У вас уже есть неоплаченные брони. Оплатите или отмените их',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Время: ночной тариф начинается строго в своё время,
    //    у пакета и ночи длительность берётся из тарифа
    if (tariff.kind === 'night' && tariff.timeFrom && dto.startTime !== tariff.timeFrom) {
      throw badRequest('NIGHT_FIXED_TIME', `Ночной тариф начинается в ${tariff.timeFrom}`);
    }
    const hours = tariff.kind === 'hourly' ? dto.hours : (tariff.hours ?? 1);

    const startsAt = toInstant(dto.date, dto.startTime);
    const endsAt = addHoursToDate(startsAt, hours);
    if (Number.isNaN(startsAt.getTime())) throw badRequest('INVALID_DATE', 'Некорректная дата');

    const now = Date.now();
    if (startsAt.getTime() < now - 15 * 60_000) {
      throw badRequest('TIME_IN_PAST', 'Нельзя забронировать на прошедшее время');
    }
    if (startsAt.getTime() > now + MAX_DAYS_AHEAD * 24 * 3_600_000) {
      throw badRequest('TOO_FAR_AHEAD', `Бронировать можно не дальше чем на ${MAX_DAYS_AHEAD} дней вперёд`);
    }

    // Ночной тариф сам задаёт своё окно, остальные — в часы работы клуба
    const workingHours = { open: club.openTime, close: club.closeTime, is24h: club.is24h };
    if (tariff.kind !== 'night' && !fitsWorkingHours(workingHours, dto.startTime, hours)) {
      throw badRequest('CLUB_CLOSED', `Клуб работает с ${club.openTime} до ${club.closeTime}`);
    }

    // 4. Места. Буткемп бронируется только целиком (вся комната)
    const isRoom = zone.type === 'bootcamp';
    let seats: Seat[];
    if (isRoom) {
      seats = await em.findBy(Seat, { zoneId: zone.id, isActive: true });
    } else {
      const ids = [...new Set(dto.seatIds)];
      seats = await em.findBy(Seat, { id: In(ids), zoneId: zone.id, isActive: true });
      if (seats.length !== ids.length) throw badRequest('SEAT_NOT_FOUND', 'Некоторые места не найдены в этой зоне');
    }
    if (seats.length === 0) throw badRequest('SEAT_NOT_FOUND', 'В зоне нет доступных мест');

    // 5. Блокируем строки мест (SELECT ... FOR UPDATE): параллельная бронь
    //    тех же мест будет ждать, пока наша транзакция не закончится.
    //    Порядок по id — чтобы две транзакции не заблокировали друг друга (deadlock)
    const seatIds = seats.map((s) => s.id).sort();
    await em.query(`SELECT id FROM seats WHERE id = ANY($1) ORDER BY id FOR UPDATE`, [seatIds]);

    const busy = await this.occupancy.busySeatIds(seatIds, startsAt, endsAt, em);
    if (busy.size > 0) {
      const numbers = seats.filter((s) => busy.has(s.id)).map((s) => `№${s.number}`);
      throw conflict(
        'SEAT_TAKEN',
        isRoom ? 'Комната уже занята на это время' : `Места ${numbers.join(', ')} уже заняты на это время`,
      );
    }

    // 6. Сумму считает сервер (та же формула, что calcTotal на фронте)
    const base = tariff.kind === 'hourly' ? tariff.price * hours : tariff.price;
    const total = base * (isRoom ? 1 : seats.length);
    if (dto.total !== undefined && dto.total !== total) {
      throw conflict('PRICE_CHANGED', `Стоимость изменилась: ${total} ₸. Проверьте заказ и подтвердите ещё раз`);
    }

    // 7. Сохраняем бронь вместе с местами
    const booking = em.create(Booking, {
      id: generateBookingId(),
      userId: user.id,
      clubId: club.id,
      zoneId: zone.id,
      tariffId: tariff.id,
      date: dto.date,
      startTime: dto.startTime,
      hours,
      startsAt,
      endsAt,
      total,
      customerName: dto.customerName,
      customerPhone: normalizePhone(dto.customerPhone),
      status: 'pending_payment',
      expiresAt: new Date(now + this.holdMinutes * 60_000),
      cancelledAt: null,
    });
    await em.insert(Booking, booking);
    // Места — отдельными строками в booking_seats. Именно здесь сработает
    // ограничение no_double_booking, если кто-то успел занять место параллельно
    await em.insert(
      BookingSeat,
      seatIds.map((seatId) => ({ bookingId: booking.id, seatId, startsAt, endsAt, isActive: true })),
    );
    return booking.id;
  }

  async findMy(user: User) {
    const list = await this.bookings.find({
      where: { userId: user.id },
      relations: BOOKING_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return list.map(toBookingDto);
  }

  async findOneForUser(user: User, id: string) {
    const booking = await this.bookings.findOne({ where: { id }, relations: BOOKING_RELATIONS });
    if (!booking || booking.userId !== user.id) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
    return toBookingDto(booking);
  }

  /** Отмена игроком: только своя бронь и только до начала сеанса */
  async cancelByUser(user: User, id: string) {
    await this.ds.transaction(async (em) => {
      const booking = await this.lockBooking(em, id);
      if (booking.userId !== user.id) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
      if (booking.startsAt.getTime() <= Date.now()) {
        throw badRequest('ALREADY_STARTED', 'Сеанс уже начался — отменить бронь нельзя');
      }
      await this.cancelInTx(em, booking);
    });
    return this.findOneForUser(user, id);
  }

  /** Отмена клубом (из кабинета админа) */
  async cancelByClub(clubId: string, id: string) {
    await this.ds.transaction(async (em) => {
      const booking = await this.lockBooking(em, id);
      if (booking.clubId !== clubId) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
      await this.cancelInTx(em, booking);
    });
  }

  /** Подтверждение клубом без онлайн-оплаты (например, оплатили наличными на кассе) */
  async confirmByClub(clubId: string, id: string) {
    await this.ds.transaction(async (em) => {
      const booking = await this.lockBooking(em, id);
      if (booking.clubId !== clubId) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
      await this.confirmInTx(em, booking);
    });
  }

  /**
   * Перевод pending_payment → confirmed. Используется и оплатой, и админом.
   * Бронь уже должна быть заблокирована (lockBooking) в этой же транзакции.
   */
  async confirmInTx(em: EntityManager, booking: Booking) {
    if (booking.status === 'confirmed') return;
    const expired =
      booking.status === 'expired' ||
      (booking.status === 'pending_payment' && booking.expiresAt && booking.expiresAt.getTime() <= Date.now());
    if (expired) throw conflict('BOOKING_EXPIRED', 'Время на оплату истекло, бронь снята');
    if (booking.status !== 'pending_payment') {
      throw conflict('BOOKING_NOT_PENDING', 'Эту бронь нельзя подтвердить');
    }
    await em.update(Booking, booking.id, { status: 'confirmed', expiresAt: null });
  }

  private async cancelInTx(em: EntityManager, booking: Booking) {
    if (booking.status !== 'pending_payment' && booking.status !== 'confirmed') {
      throw conflict('BOOKING_NOT_ACTIVE', 'Бронь уже отменена или просрочена');
    }
    await em.update(Booking, booking.id, { status: 'cancelled', cancelledAt: new Date(), expiresAt: null });
    await em.update(BookingSeat, { bookingId: booking.id }, { isActive: false });
  }

  /** Читает бронь с блокировкой строки — чтобы оплата и отмена не столкнулись */
  async lockBooking(em: EntityManager, id: string): Promise<Booking> {
    const booking = await em.findOne(Booking, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!booking) throw notFound('BOOKING_NOT_FOUND', 'Бронь не найдена');
    return booking;
  }

  /** Список броней клуба для кабинета админа */
  async findForClub(clubId: string, filters: { date?: string; status?: string; id?: string }) {
    const qb = this.bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.zone', 'zone')
      .leftJoinAndSelect('b.tariff', 'tariff')
      .leftJoinAndSelect('b.club', 'club')
      .leftJoinAndSelect('b.seats', 'bs')
      .leftJoinAndSelect('bs.seat', 'seat')
      .where('b.club_id = :clubId', { clubId })
      .orderBy('b.starts_at', 'ASC');
    if (filters.date) qb.andWhere('b.date = :date', { date: filters.date });
    if (filters.status) qb.andWhere('b.status = :status', { status: filters.status });
    if (filters.id) qb.andWhere('b.id = :id', { id: filters.id });
    return (await qb.getMany()).map(toBookingDto);
  }

  /** Есть ли у пользователя подтверждённая бронь в клубе, которая уже началась (для отзывов) */
  async hasVisited(userId: string, clubId: string) {
    const rows = await this.ds.query(
      `SELECT 1 FROM bookings WHERE user_id = $1 AND club_id = $2
          AND status = 'confirmed' AND starts_at <= now() LIMIT 1`,
      [userId, clubId],
    );
    return rows.length > 0;
  }
}
