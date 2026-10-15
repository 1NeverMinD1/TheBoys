import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

class SeatLayoutItemDto {
  /** Номер места, который видит игрок */
  @IsInt()
  @Min(1)
  number: number;

  /** Координаты на схеме (клетки сетки) */
  @IsInt()
  @Min(0)
  @Max(100)
  x: number;

  @IsInt()
  @Min(0)
  @Max(100)
  y: number;
}

/**
 * PUT /admin/clubs/:clubId/zones/:zoneId/layout
 * Полная схема зоны: каких мест нет в списке — те убираются со схемы.
 */
export class UpdateLayoutDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SeatLayoutItemDto)
  seats: SeatLayoutItemDto[];
}
