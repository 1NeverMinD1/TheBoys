import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Club } from '../clubs/entities/club.entity';
import { User } from '../users/user.entity';

// Один пользователь — один отзыв на клуб (его можно удалить и написать заново)
@Entity('reviews')
@Unique(['clubId', 'userId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'club_id' })
  clubId: string;

  @ManyToOne(() => Club, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 1..5 (проверяется и в DTO, и CHECK-ограничением в базе)
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', default: '' })
  text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
