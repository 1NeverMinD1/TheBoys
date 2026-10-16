import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Club } from '../clubs/entities/club.entity';

/** player — обычный игрок, club_admin — сотрудник/владелец клуба */
export type UserRole = 'player' | 'club_admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Пароль НИКОГДА не храним как есть — только bcrypt-хеш.
  // select: false — поле не попадает в обычные запросы, чтобы случайно не утекло.
  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', default: 'player' })
  role: UserRole;

  // Для админа клуба — какой клуб он администрирует
  @Column({ name: 'club_id', type: 'varchar', nullable: true })
  clubId: string | null;

  @ManyToOne(() => Club, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'club_id' })
  club?: Club | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
