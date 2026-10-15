import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Zone } from './zone.entity';

export type TariffKind = 'hourly' | 'package' | 'night';

@Entity('tariffs')
export class Tariff {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => Zone, (zone) => zone.tariffs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  kind: TariffKind;

  // hourly: 1 (цена за час), package/night: длительность пакета
  @Column({ type: 'int', nullable: true })
  hours: number | null;

  // Цена в тенге (целое число — копейки/тиыны не используем)
  @Column({ type: 'int' })
  price: number;

  // Только для ночного тарифа: "23:00" – "07:00"
  @Column({ name: 'time_from', type: 'varchar', nullable: true })
  timeFrom: string | null;

  @Column({ name: 'time_to', type: 'varchar', nullable: true })
  timeTo: string | null;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
