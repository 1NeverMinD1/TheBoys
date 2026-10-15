import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Seat } from '../../clubs/entities/seat.entity';
import { Booking } from './booking.entity';

/**
 * Связка «бронь ↔ место». Одна бронь может занимать несколько мест.
 *
 * Время (starts_at/ends_at) специально продублировано из брони: на эту таблицу
 * в базе висит ограничение EXCLUDE (см. миграцию), которое физически не даст
 * записать два активных пересекающихся по времени интервала на одно место.
 * Это главная защита от двойной брони.
 */
@Entity('booking_seats')
export class BookingSeat {
  @PrimaryColumn({ name: 'booking_id' })
  bookingId: string;

  @PrimaryColumn({ name: 'seat_id' })
  seatId: string;

  @ManyToOne(() => Booking, (b) => b.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Seat)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  // false, когда бронь отменена/просрочена — тогда место снова свободно
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
