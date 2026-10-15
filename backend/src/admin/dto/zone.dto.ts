import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import type { ZoneType } from '../../clubs/entities/zone.entity';

class PcSpecDto {
  @IsString() cpu: string;
  @IsString() gpu: string;
  @IsInt() @Min(1) ramGb: number;
  @IsString() monitor: string;
  @IsInt() @Min(30) refreshRateHz: number;
}

export class CreateZoneDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsIn(['standard', 'vip', 'bootcamp', 'console'])
  type: ZoneType;

  /** null — для консольной зоны без ПК */
  @IsOptional()
  @ValidateNested()
  @Type(() => PcSpecDto)
  pcSpec?: PcSpecDto | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  peripherals?: string[];

  /** Сразу создать N мест сеткой (потом схему можно поправить через /layout) */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  seatsCount?: number;
}

// PartialType делает все поля необязательными — удобно для PATCH
export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
