import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { notFound } from '../common/errors/app.exception';
import { addHoursToDate, toInstant } from '../common/time/astana-time';
import { SeatsQueryDto } from './dto/seats-query.dto';
import { Seat } from './entities/seat.entity';
import { Zone } from './entities/zone.entity';
import { OccupancyService } from './occupancy.service';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Zone) private readonly zones: Repository<Zone>,
    @InjectRepository(Seat) private readonly seats: Repository<Seat>,
    private readonly occupancy: OccupancyService,
  ) {}

  /**
   * Места зоны с занятостью на выбранные дату/время.
   * Ответ — массив Seat из src/types/booking.ts (+ x, y для схемы зала).
   */
  async getZoneSeats(clubId: string, zoneId: string, query: SeatsQueryDto) {
    const zone = await this.zones.findOneBy({ id: zoneId, clubId, isActive: true });
    if (!zone) throw notFound('ZONE_NOT_FOUND', 'Зона не найдена');

    const seats = await this.seats.find({
      where: { zoneId, isActive: true },
      order: { number: 'ASC' },
    });

    const from = toInstant(query.date, query.startTime);
    const to = addHoursToDate(from, query.hours ?? 1);
    const busy = await this.occupancy.busySeatIds(
      seats.map((s) => s.id),
      from,
      to,
    );

    return seats.map((s) => ({
      id: s.id,
      number: s.number,
      isFree: !busy.has(s.id),
      x: s.x,
      y: s.y,
    }));
  }
}
