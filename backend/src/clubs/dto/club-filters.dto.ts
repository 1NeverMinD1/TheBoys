import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { ZoneType } from '../entities/zone.entity';

const ZONE_TYPES: ZoneType[] = ['standard', 'vip', 'bootcamp', 'console'];
const SORTS = ['rating', 'price-asc', 'price-desc', 'seats'] as const;
export type ClubSort = (typeof SORTS)[number];

// "1" / "true" → true
const toBool = ({ value }: { value: unknown }) => value === '1' || value === 'true' || value === true;

/**
 * Фильтры каталога. Имена параметров совпадают с тем, что фронт кладёт в URL
 * (src/lib/clubFilters.ts), поэтому строку запроса можно просто пробросить:
 *   GET /clubs?q=arena&zones=vip,bootcamp&maxPrice=1000&minHz=240&free=1&24h=1&sort=price-asc
 * (параметр 24h читается в контроллере отдельно — имя не может быть полем класса)
 */
export class ClubFiltersDto {
  /** Поиск по названию и адресу */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  city?: string;

  /** Типы зон через запятую: standard,vip,bootcamp,console */
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsIn(ZONE_TYPES, { each: true })
  zones?: ZoneType[];

  /** Максимальная цена за час */
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  maxPrice?: number;

  /** Минимальная частота монитора, Гц */
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  minHz?: number;

  /** Только где есть свободные места */
  @IsOptional()
  @Transform(toBool)
  free?: boolean;

  @IsOptional()
  @IsIn(SORTS)
  sort?: ClubSort;
}
