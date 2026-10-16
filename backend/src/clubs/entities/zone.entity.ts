import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Club } from './club.entity';
import { Seat } from './seat.entity';
import { Tariff } from './tariff.entity';

export type ZoneType = 'standard' | 'vip' | 'bootcamp' | 'console';

export interface PcSpec {
  cpu: string;
  gpu: string;
  ramGb: number;
  monitor: string;
  refreshRateHz: number;
}

@Entity('zones')
export class Zone {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'club_id' })
  clubId: string;

  @ManyToOne(() => Club, (club) => club.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: ZoneType;

  // Характеристики ПК храним одним JSON-полем: у консольной зоны их нет (null),
  // а структуру удобно отдавать фронту как есть.
  @Column({ name: 'pc_spec', type: 'jsonb', nullable: true })
  pcSpec: PcSpec | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  peripherals: string[];

  // Порядок показа зон на странице клуба
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  // «Мягкое удаление»: зону с историей броней нельзя стереть, её прячут
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Tariff, (tariff) => tariff.zone)
  tariffs: Tariff[];

  @OneToMany(() => Seat, (seat) => seat.zone)
  seats: Seat[];
}
