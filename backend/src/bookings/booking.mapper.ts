import { Booking } from './entities/booking.entity';

/**
 * Booking из src/types/booking.ts + несколько полезных полей сверху:
 *  expiresAt — до какого момента надо оплатить (для таймера на фронте)
 *  clubName, zoneName, tariffName, seatNumbers — чтобы «Мои брони» не делали лишних запросов
 */
export function toBookingDto(b: Booking) {
  const seats = [...(b.seats ?? [])].sort((x, y) => (x.seat?.number ?? 0) - (y.seat?.number ?? 0));
  return {
    id: b.id,
    clubId: b.clubId,
    zoneId: b.zoneId,
    seatIds: seats.map((s) => s.seatId),
    date: b.date,
    startTime: b.startTime,
    tariffId: b.tariffId,
    hours: b.hours,
    total: b.total,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.status === 'pending_payment' && b.expiresAt ? b.expiresAt.toISOString() : null,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    clubName: b.club?.name,
    zoneName: b.zone?.name,
    tariffName: b.tariff?.name,
    seatNumbers: seats.map((s) => s.seat?.number).filter((n): n is number => n !== undefined),
  };
}

export type BookingDto = ReturnType<typeof toBookingDto>;

/** Какие связи подгружать, чтобы маппер заполнил все поля */
export const BOOKING_RELATIONS = { club: true, zone: true, tariff: true, seats: { seat: true } } as const;
