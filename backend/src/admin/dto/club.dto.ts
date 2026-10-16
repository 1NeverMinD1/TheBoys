import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

class CoordsDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

class WorkingHoursDto {
  @Matches(TIME, { message: 'open должен быть в формате HH:mm' })
  open: string;

  @Matches(TIME, { message: 'close должен быть в формате HH:mm' })
  close: string;

  @IsBoolean()
  is24h: boolean;
}

/** PATCH /admin/clubs/:clubId — все поля необязательные, меняем только присланные */
export class UpdateClubDto {
  @IsOptional() @IsString() @Length(2, 80)
  name?: string;

  @IsOptional() @IsString() @Length(2, 60)
  city?: string;

  @IsOptional() @IsString() @Length(2, 200)
  address?: string;

  @IsOptional() @IsString() @Length(5, 30)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @ValidateNested() @Type(() => CoordsDto)
  coords?: CoordsDto;

  @IsOptional() @ValidateNested() @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  /** Ссылки на фото (загрузку файлов добавим отдельно) */
  @IsOptional() @IsArray() @IsString({ each: true })
  photos?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  equipment?: string[];
}
