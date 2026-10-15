import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email: string;

  @IsString()
  password: string;
}
