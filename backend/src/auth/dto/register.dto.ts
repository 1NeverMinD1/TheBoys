import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  password: string;

  @IsString()
  @Length(2, 60, { message: 'Имя должно быть от 2 до 60 символов' })
  @Transform(({ value }) => String(value).trim())
  name: string;

  /** Телефон в формате +7XXXXXXXXXX (необязательно) */
  @IsOptional()
  @Matches(/^\+?\d{11}$/, { message: 'Телефон должен содержать 11 цифр' })
  phone?: string;
}
