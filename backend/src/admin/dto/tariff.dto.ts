import { PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min, ValidateIf } from 'class-validator';
import type { TariffKind } from '../../clubs/entities/tariff.entity';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateTariffDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsIn(['hourly', 'package', 'night'])
  kind: TariffKind;

  /** Для package/night — длительность в часах. Для hourly не нужно (всегда 1) */
  @ValidateIf((o) => o.kind !== 'hourly')
  @IsInt()
  @Min(1)
  @Max(24)
  hours?: number | null;

  @IsInt()
  @Min(0)
  price: number;

  /** Только для night: начало и конец ночи */
  @ValidateIf((o) => o.kind === 'night')
  @Matches(TIME, { message: 'timeFrom должен быть в формате HH:mm' })
  timeFrom?: string | null;

  @ValidateIf((o) => o.kind === 'night')
  @Matches(TIME, { message: 'timeTo должен быть в формате HH:mm' })
  timeTo?: string | null;
}

export class UpdateTariffDto extends PartialType(CreateTariffDto) {
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
