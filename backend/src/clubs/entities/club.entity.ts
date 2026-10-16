import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../../database/transformers';
import { Zone } from './zone.entity';

@Entity('clubs')
export class Club {
  // id — человекочитаемый slug ("respawn-arena"), как в моках фронта
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  address: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, transformer: numericTransformer })
  lat: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, transformer: numericTransformer })
  lng: number;

  @Column()
  phone: string;

  // Часы работы — "HH:mm" по Астане
  @Column({ name: 'open_time' })
  openTime: string;

  @Column({ name: 'close_time' })
  closeTime: string;

  @Column({ name: 'is_24h', default: false })
  is24h: boolean;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  photos: string[];

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  equipment: string[];

  // Рейтинг, который был у клуба до нашей системы (импорт из моков).
  // Новые отзывы «досчитываются» к нему — см. ReviewsService.recalcRating
  @Column({ name: 'base_rating', type: 'numeric', precision: 3, scale: 2, default: 0, transformer: numericTransformer })
  baseRating: number;

  @Column({ name: 'base_reviews_count', default: 0 })
  baseReviewsCount: number;

  // Итоговые рейтинг и число отзывов (кэш, пересчитывается при каждом отзыве)
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0, transformer: numericTransformer })
  rating: number;

  @Column({ name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @OneToMany(() => Zone, (zone) => zone.club)
  zones: Zone[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
