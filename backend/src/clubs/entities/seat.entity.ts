import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Zone } from './zone.entity';

/**
 * Конкретное место (ПК / консоль) в зоне.
 * x, y — координаты на схеме зала (в «клетках» сетки), их задаёт админ клуба.
 */
@Entity('seats')
@Unique(['zoneId', 'number'])
export class Seat {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => Zone, (zone) => zone.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'int', default: 0 })
  x: number;

  @Column({ type: 'int', default: 0 })
  y: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
