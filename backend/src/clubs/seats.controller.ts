import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeatsQueryDto } from './dto/seats-query.dto';
import { SeatsService } from './seats.service';

@ApiTags('seats')
@Controller('clubs/:clubId/zones/:zoneId/seats')
export class SeatsController {
  constructor(private readonly seats: SeatsService) {}

  /**
   * GET /clubs/respawn-arena/zones/respawn-vip/seats?date=2026-10-15&startTime=21:00&hours=3
   * hours необязателен (по умолчанию 1), но лучше передавать длительность
   * выбранного тарифа — тогда «свободно» будет означать «свободно на весь сеанс».
   */
  @Get()
  list(
    @Param('clubId') clubId: string,
    @Param('zoneId') zoneId: string,
    @Query() query: SeatsQueryDto,
  ) {
    return this.seats.getZoneSeats(clubId, zoneId, query);
  }
}
