import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { notFound } from '../common/errors/app.exception';
import { ClubDto, toClubDto, toClubSummary } from './club.mapper';
import { ClubFiltersDto } from './dto/club-filters.dto';
import { Club } from './entities/club.entity';
import { OccupancyService } from './occupancy.service';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club) private readonly clubs: Repository<Club>,
    private readonly occupancy: OccupancyService,
  ) {}

  /**
   * Загружает клубы вместе с активными зонами и тарифами.
   * relations — это JOIN'ы, которые TypeORM сделает за нас.
   */
  private async loadClubs(where: FindOptionsWhere<Club> = {}): Promise<ClubDto[]> {
    const clubs = await this.clubs.find({
      where,
      relations: { zones: { tariffs: true } },
      order: { name: 'ASC', zones: { sortOrder: 'ASC', tariffs: { sortOrder: 'ASC' } } },
    });

    // Прячем «удалённые» админом зоны и тарифы
    for (const club of clubs) {
      club.zones = club.zones.filter((z) => z.isActive);
      for (const zone of club.zones) zone.tariffs = zone.tariffs.filter((t) => t.isActive);
    }

    // Одним запросом считаем места и занятость по всем зонам сразу
    const zoneIds = clubs.flatMap((c) => c.zones.map((z) => z.id));
    const stats = await this.occupancy.zoneStats(zoneIds);
    return clubs.map((c) => toClubDto(c, stats));
  }

  async findAll(filters: ClubFiltersDto, only24h: boolean) {
    const summaries = (await this.loadClubs()).map(toClubSummary);
    const query = filters.q?.trim().toLowerCase();

    // Клубов немного, поэтому фильтруем в памяти — та же логика, что
    // в src/lib/clubFilters.ts на фронте. Когда клубов станут тысячи,
    // эти условия переедут в SQL.
    const filtered = summaries.filter((club) => {
      if (query && !`${club.name} ${club.address}`.toLowerCase().includes(query)) return false;
      if (filters.city && club.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.zones?.length && !filters.zones.some((t) => club.zoneTypes.includes(t))) return false;
      if (filters.maxPrice && club.minPricePerHour > filters.maxPrice) return false;
      if (filters.minHz && club.maxRefreshRateHz < filters.minHz) return false;
      if (filters.free && club.seatsFree === 0) return false;
      if (only24h && !club.is24h) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'price-asc':
          return a.minPricePerHour - b.minPricePerHour;
        case 'price-desc':
          return b.minPricePerHour - a.minPricePerHour;
        case 'seats':
          return b.seatsFree - a.seatsFree;
        default:
          return b.rating - a.rating;
      }
    });
  }

  async findOne(id: string): Promise<ClubDto> {
    const [club] = await this.loadClubs({ id });
    if (!club) throw notFound('CLUB_NOT_FOUND', 'Клуб не найден');
    return club;
  }

  async exists(id: string) {
    return this.clubs.existsBy({ id });
  }
}
