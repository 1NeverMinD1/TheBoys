import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AppException, conflict } from '../common/errors/app.exception';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Что лежит внутри JWT-токена */
export interface JwtPayload {
  sub: string; // id пользователя (стандартное имя поля в JWT)
  role: User['role'];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.users.existsByEmail(dto.email)) {
      throw conflict('EMAIL_TAKEN', 'Пользователь с таким email уже зарегистрирован');
    }
    // 10 «раундов» bcrypt — стандартный баланс скорость/стойкость
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone ? normalizePhone(dto.phone) : null,
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    // Специально одинаковая ошибка для «нет такого email» и «неверный пароль»,
    // чтобы нельзя было перебором узнать, кто зарегистрирован
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new AppException('INVALID_CREDENTIALS', 'Неверный email или пароль', HttpStatus.UNAUTHORIZED);
    }
    return this.issueToken(user);
  }

  private async issueToken(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: this.users.toPublic(user),
    };
  }
}

/** "8 700 111 22 33" → "+77001112233" */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `+7${digits.slice(-10)}`;
}
