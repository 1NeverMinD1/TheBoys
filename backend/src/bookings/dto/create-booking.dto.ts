import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Тело POST /bookings — тип BookingRequest из src/types/booking.ts */
export class CreateBookingDto {
  @IsString()
  clubId: string;

  @IsString()
  zoneId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Выберите хотя бы одно место' })
  @ArrayMaxSize(10, { message: 'За раз можно забронировать не больше 10 мест' })
  @IsString({ each: true })
  seatIds: string[];

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date должен быть в формате YYYY-MM-DD' })
  date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime должен быть в формате HH:mm' })
  startTime: string;

  @IsString()
  tariffId: string;

  /** Для почасового тарифа — сколько часов; для пакета/ночи берётся из тарифа */
  @IsInt()
  @Min(1)
  @Max(12)
  hours: number;

  /**
   * Сумма, которую видел пользователь. Сервер всё равно считает сам;
   * если суммы не совпали (цены поменялись) — вернём 409 PRICE_CHANGED.
   */
  @IsOptional()
  @IsInt()
  total?: number;

  @IsString()
  @Length(2, 60, { message: 'Имя должно быть от 2 до 60 символов' })
  @Transform(({ value }) => String(value).trim())
  customerName: string;

  @IsString()
  @Matches(/^\D*(\d\D*){11}$/, { message: 'Телефон должен содержать 11 цифр' })
  customerPhone: string;
}
