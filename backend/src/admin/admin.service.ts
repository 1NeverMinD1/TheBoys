import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { ClubsService } from '../clubs/clubs.service';
import { Club } from '../clubs/entities/club.entity';
import { Seat } from '../clubs/entities/seat.entity';
import { Tariff } from '../clubs/entities/tariff.entity';
import { Zone } from '../clubs/entities/zone.entity';
import { badRequest, conflict, notFound } from '../common/errors/app.exception';
import { User } from '../users/user.entity';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { UpdateClubDto } from './dto/club.dto';
import { UpdateLayoutDto } from './dto/layout.dto';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';

const shortId = () => randomBytes(3).toString('hex'); // "a1b2c3"

/**
 * Кабинет клуба. Почти все методы возвращают клуб целиком (тот же формат,
 * что GET /clubs/:id) — так фронту кабинета проще перерисовать экран.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly clubs: ClubsService,
    private readonly bookings: BookingsService,
  ) {}

  async myClubs(user: User) {
    return user.clubId ? [await this.clubs.findOne(user.clubId)] : [];
  }

  // --- Клуб -----------------------------------------------------------------

  async updateClub(clubId: string, dto: UpdateClubDto) {
    const patch: Partial<Club> = {
      name: dto.name,
      city: dto.city,
      address: dto.address,
      phone: dto.phone,
      description: dto.description,
      photos: dto.photos,
      equipment: dto.equipment,
      lat: dto.coords?.lat,
      lng: dto.coords?.lng,
      openTime: dto.workingHours?.open,
      closeTime: dto.workingHours?.close,
      is24h: dto.workingHours?.is24h,
    };
    // Убираем undefined, чтобы не затереть поля, которые не присылали
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length > 0) await this.ds.manager.update(Club, clubId, clean);
    return this.clubs.findOne(clubId);
  }

  // --- Зоны -----------------------------------------------------------------

  async createZone(clubId: string, dto: CreateZoneDto) {
    await this.ds.transaction(async (em) => {
      const maxOrder = await em.maximum(Zone, 'sortOrder', { clubId });
      const zone = await em.save(
        em.create(Zone, {
          id: `${clubId}-${shortId()}`,
          clubId,
          name: dto.name,
          type: dto.type,
          pcSpec: dto.pcSpec ?? null,
          peripherals: dto.peripherals ?? [],
          sortOrder: (maxOrder ?? -1) + 1,
        }),
      );
      // Сразу создаём места сеткой по 6 в ряд
      const seats = Array.from({ length: dto.seatsCount ?? 0 }, (_, i) =>
        em.create(Seat, { id: `${zone.id}-seat-${i + 1}`, zoneId: zone.id, number: i + 1, x: i % 6, y: Math.floor(i / 6) }),
      );
      if (seats.length) await em.save(seats);
    });
    return this.clubs.findOne(clubId);
  }

  async updateZone(clubId: string, zoneId: string, dto: UpdateZoneDto) {
    await this.getZone(this.ds.manager, clubId, zoneId);
    const { seatsCount: _ignored, ...patch } = dto;
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length > 0) await this.ds.manager.update(Zone, zoneId, clean);
    return this.clubs.findOne(clubId);
  }

  /** «Удаление» зоны = скрытие. Нельзя, пока на неё есть будущие брони */
  async deleteZone(clubId: string, zoneId: string) {
    await this.getZone(this.ds.manager, clubId, zoneId);
    const [{ cnt }] = await this.ds.query(
      `SELECT count(*)::int AS cnt FROM bookings
        WHERE zone_id = $1 AND status IN ('pending_payment','confirmed') AND ends_at > now()`,
      [zoneId],
    );
    if (cnt > 0) throw conflict('ZONE_HAS_BOOKINGS', `На зону есть активные брони (${cnt}). Сначала отмените их`);
    await this.ds.manager.update(Zone, zoneId, { isActive: false });
    return this.clubs.findOne(clubId);
  }

  // --- Тарифы ---------------------------------------------------------------

  async createTariff(clubId: string, zoneId: string, dto: CreateTariffDto) {
    await this.getZone(this.ds.manager, clubId, zoneId);
    const maxOrder = await this.ds.manager.maximum(Tariff, 'sortOrder', { zoneId });
    await this.ds.manager.save(
      this.ds.manager.create(Tariff, {
        id: `${zoneId}-t-${shortId()}`,
        zoneId,
        ...normalizeTariff(dto),
        sortOrder: (maxOrder ?? -1) + 1,
      }),
    );
    return this.clubs.findOne(clubId);
  }

  async updateTariff(clubId: string, zoneId: string, tariffId: string, dto: UpdateTariffDto) {
    const tariff = await this.getTariff(clubId, zoneId, tariffId);
    // Сливаем старые и новые значения и заново проверяем целостность (например, kind сменили на night)
    const merged = normalizeTariff({ ...tariff, ...stripUndefined(dto) } as CreateTariffDto);
    await this.ds.manager.update(Tariff, tariffId, { ...merged, sortOrder: dto.sortOrder ?? tariff.sortOrder });
    return this.clubs.findOne(clubId);
  }

  /** Тариф скрываем (на него ссылаются старые брони — стереть нельзя) */
  async deleteTariff(clubId: string, zoneId: string, tariffId: string) {
    await this.getTariff(clubId, zoneId, tariffId);
    await this.ds.manager.update(Tariff, tariffId, { isActive: false });
    return this.clubs.findOne(clubId);
  }

  // --- Места и схема зала ---------------------------------------------------

  async getLayout(clubId: string, zoneId: string) {
    await this.getZone(this.ds.manager, clubId, zoneId);
    const seats = await this.ds.manager.find(Seat, { where: { zoneId, isActive: true }, order: { number: 'ASC' } });
    return { zoneId, seats: seats.map((s) => ({ id: s.id, number: s.number, x: s.x, y: s.y })) };
  }

  /**
   * Сохранить схему зоны целиком.
   *  - место с таким номером уже есть → двигаем (x, y), при необходимости «воскрешаем»
   *  - нового номера нет → создаём место
   *  - места, которых нет в списке → убираем со схемы (если на них нет будущих броней)
   */
  async updateLayout(clubId: string, zoneId: string, dto: UpdateLayoutDto) {
    const numbers = dto.seats.map((s) => s.number);
    if (new Set(numbers).size !== numbers.length) throw badRequest('DUPLICATE_SEAT', 'Номера мест повторяются');
    const cells = dto.seats.map((s) => `${s.x}:${s.y}`);
    if (new Set(cells).size !== cells.length) throw badRequest('DUPLICATE_CELL', 'Два места стоят в одной клетке');

    await this.ds.transaction(async (em) => {
      await this.getZone(em, clubId, zoneId);
      const existing = await em.findBy(Seat, { zoneId });
      const byNumber = new Map(existing.map((s) => [s.number, s]));

      // Какие активные места пропали из схемы
      const removed = existing.filter((s) => s.isActive && !numbers.includes(s.number));
      if (removed.length) {
        const busy: { number: number }[] = await em.query(
          `SELECT DISTINCT s.number FROM booking_seats bs
             JOIN bookings b ON b.id = bs.booking_id
             JOIN seats s ON s.id = bs.seat_id
            WHERE bs.seat_id = ANY($1) AND bs.is_active AND bs.ends_at > now()
              AND b.status IN ('pending_payment','confirmed')
            ORDER BY s.number`,
          [removed.map((s) => s.id)],
        );
        if (busy.length) {
          throw conflict('SEAT_HAS_BOOKINGS', `На места ${busy.map((b) => `№${b.number}`).join(', ')} есть брони`);
        }
        await em.update(Seat, { id: In(removed.map((s) => s.id)) }, { isActive: false });
      }

      for (const item of dto.seats) {
        const seat = byNumber.get(item.number);
        if (seat) {
          await em.update(Seat, seat.id, { x: item.x, y: item.y, isActive: true });
        } else {
          await em.insert(Seat, { id: `${zoneId}-seat-${item.number}`, zoneId, number: item.number, x: item.x, y: item.y });
        }
      }
    });
    return this.getLayout(clubId, zoneId);
  }

  // --- Брони клуба ----------------------------------------------------------

  listBookings(clubId: string, query: AdminBookingsQueryDto) {
    return this.bookings.findForClub(clubId, query);
  }

  async confirmBooking(clubId: string, bookingId: string) {
    await this.bookings.confirmByClub(clubId, bookingId);
    return this.findClubBooking(clubId, bookingId);
  }

  async cancelBooking(clubId: string, bookingId: string) {
    await this.bookings.cancelByClub(clubId, bookingId);
    return this.findClubBooking(clubId, bookingId);
  }

  private async findClubBooking(clubId: string, bookingId: string) {
    const [booking] = await this.bookings.findForClub(clubId, { id: bookingId });
    return booking;
  }

  // --- helpers --------------------------------------------------------------

  private async getZone(em: EntityManager, clubId: string, zoneId: string) {
    const zone = await em.findOneBy(Zone, { id: zoneId, clubId, isActive: true });
    if (!zone) throw notFound('ZONE_NOT_FOUND', 'Зона не найдена');
    return zone;
  }

  private async getTariff(clubId: string, zoneId: string, tariffId: string) {
    await this.getZone(this.ds.manager, clubId, zoneId);
    const tariff = await this.ds.manager.findOneBy(Tariff, { id: tariffId, zoneId, isActive: true });
    if (!tariff) throw notFound('TARIFF_NOT_FOUND', 'Тариф не найден');
    return tariff;
  }
}

/** Приводит тариф к целостному виду: у почасового hours=1 и нет ночного окна и т.п. */
function normalizeTariff(dto: CreateTariffDto) {
  if (dto.kind !== 'hourly' && !dto.hours) {
    throw badRequest('TARIFF_HOURS_REQUIRED', 'Для пакета и ночного тарифа укажите длительность (hours)');
  }
  if (dto.kind === 'night' && (!dto.timeFrom || !dto.timeTo)) {
    throw badRequest('NIGHT_TIME_REQUIRED', 'Для ночного тарифа укажите timeFrom и timeTo');
  }
  return {
    name: dto.name,
    kind: dto.kind,
    price: dto.price,
    hours: dto.kind === 'hourly' ? 1 : (dto.hours ?? null),
    timeFrom: dto.kind === 'night' ? (dto.timeFrom ?? null) : null,
    timeTo: dto.kind === 'night' ? (dto.timeTo ?? null) : null,
  };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
