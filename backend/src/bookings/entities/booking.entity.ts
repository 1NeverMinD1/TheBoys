import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Club } from '../../clubs/entities/club.entity';
import { Tariff } from '../../clubs/entities/tariff.entity';
import { Zone } from '../../clubs/entities/zone.entity';
import { User } from '../../users/user.entity';
import { BookingSeat } from './booking-seat.entity';

/**
 * pending_payment — создана, ждёт оплаты (держим места BOOKING_HOLD_MINUTES минут)
 * confirmed       — оплачена (или подтверждена админом клуба)
 * cancelled       — отменена игроком или клубом
 * expired         — не оплатили вовремя, места освобождены автоматически
 */
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'expired';

@Entity('bookings')
export class Booking {
  // Короткий код брони вида "GC-7KQ2M9XA" — его удобно продиктовать на ресепшене
  @PrimaryColumn()
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'club_id' })
  clubId: string;

  @ManyToOne(() => Club)
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => Zone)
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column({ name: 'tariff_id' })
  tariffId: string;

  @ManyToOne(() => Tariff)
  @JoinColumn({ name: 'tariff_id' })
  tariff: Tariff;

  // То, что прислал фронт (дата и время по Астане) — храним, чтобы отдать как было
  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time' })
  startTime: string;

  @Column({ type: 'int' })
  hours: number;

  // Точные моменты начала и конца — по ним считаем пересечения броней
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  // Сумму считает СЕРВЕР, клиенту не доверяем
  @Column({ type: 'int' })
  total: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_phone' })
  customerPhone: string;

  @Column({ type: 'varchar', default: 'pending_payment' })
  status: BookingStatus;

  // До какого момента ждём оплату (для pending_payment)
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @OneToMany(() => BookingSeat, (bs) => bs.booking)
  seats: BookingSeat[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;
}
