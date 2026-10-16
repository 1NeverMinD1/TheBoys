import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { ClubFiltersDto } from './dto/club-filters.dto';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  /** Каталог клубов (краткий вид — ClubSummary[]) с фильтрами */
  @Get()
  @ApiQuery({ name: '24h', required: false, description: '1 — только круглосуточные' })
  findAll(@Query() filters: ClubFiltersDto, @Query('24h') only24h?: string) {
    return this.clubs.findAll(filters, only24h === '1' || only24h === 'true');
  }

  /** Клуб целиком (тип Club) */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubs.findOne(id);
  }
}
