import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class SeatsQueryDto {
  /** Дата по Астане, YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date должен быть в формате YYYY-MM-DD' })
  date: string;

  /** Время начала по Астане, HH:mm */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime должен быть в формате HH:mm' })
  startTime: string;

  /** На сколько часов проверять занятость (по умолчанию 1) */
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(24)
  hours?: number;
}
