import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { Club } from '../clubs/entities/club.entity';
import { conflict, forbidden, notFound } from '../common/errors/app.exception';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    private readonly bookings: BookingsService,
  ) {}

  async list(clubId: string) {
    await this.ensureClub(clubId);
    const list = await this.reviews.find({
      where: { clubId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return list.map((r) => this.toDto(r));
  }

  private toDto(r: Review) {
    return {
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      author: { name: r.user.name },
    };
  }

  /**
   * Оставить отзыв может только тот, кто реально был в клубе:
   * есть подтверждённая бронь, сеанс которой уже начался. Это защита от накруток.
   */
  async create(user: User, clubId: string, dto: CreateReviewDto) {
    await this.ensureClub(clubId);
    if (!(await this.bookings.hasVisited(user.id, clubId))) {
      throw forbidden('NOT_VISITED', 'Оставить отзыв можно после посещения клуба');
    }
    if (await this.reviews.existsBy({ clubId, userId: user.id })) {
      throw conflict('REVIEW_EXISTS', 'Вы уже оставили отзыв об этом клубе');
    }

    const review = await this.ds.transaction(async (em) => {
      const saved = await em.save(em.create(Review, { clubId, userId: user.id, rating: dto.rating, text: dto.text ?? '' }));
      await this.recalcRating(em, clubId);
      return saved;
    });
    return this.toDto({ ...review, user });
  }

  async removeMy(user: User, clubId: string) {
    await this.ds.transaction(async (em) => {
      const res = await em.delete(Review, { clubId, userId: user.id });
      if (!res.affected) throw notFound('REVIEW_NOT_FOUND', 'Отзыв не найден');
      await this.recalcRating(em, clubId);
    });
  }

  /**
   * Пересчёт рейтинга клуба.
   *
   * У клубов из моков уже есть «исторический» рейтинг (например 4.8 по 214 отзывам).
   * Чтобы он не обнулился, считаем средневзвешенное:
   *   (base_rating × base_count + сумма новых оценок) / (base_count + число новых)
   *
   * FOR UPDATE блокирует строку клуба — два одновременных отзыва не затрут пересчёт друг друга.
   */
  async recalcRating(em: EntityManager, clubId: string) {
    const [club] = await em.query(
      `SELECT base_rating, base_reviews_count FROM clubs WHERE id = $1 FOR UPDATE`,
      [clubId],
    );
    const [agg] = await em.query(
      `SELECT count(*)::int AS cnt, coalesce(sum(rating), 0)::int AS total FROM reviews WHERE club_id = $1`,
      [clubId],
    );
    const baseCount = Number(club.base_reviews_count);
    const count = baseCount + agg.cnt;
    const sum = Number(club.base_rating) * baseCount + agg.total;
    const rating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    await em.update(Club, clubId, { rating, reviewsCount: count });
  }

  private async ensureClub(clubId: string) {
    if (!(await this.ds.manager.existsBy(Club, { id: clubId }))) {
      throw notFound('CLUB_NOT_FOUND', 'Клуб не найден');
    }
  }
}
