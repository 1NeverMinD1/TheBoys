import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../common/errors/app.exception';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './auth.service';

/**
 * Охранник (guard) для закрытых эндпоинтов.
 *
 * 1. Берёт заголовок Authorization: Bearer <токен>
 * 2. Проверяет подпись и срок жизни токена
 * 3. Загружает пользователя из базы и кладёт в request.user
 *
 * Использование: @UseGuards(JwtAuthGuard) над методом или контроллером.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const [type, token] = (req.headers.authorization ?? '').split(' ');

    if (type !== 'Bearer' || !token) {
      throw new AppException('UNAUTHORIZED', 'Нужно войти в аккаунт', HttpStatus.UNAUTHORIZED);
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new AppException('TOKEN_INVALID', 'Сессия истекла, войдите заново', HttpStatus.UNAUTHORIZED);
    }

    // Пользователя берём из базы, а не из токена: если его роль поменяли
    // или удалили — это сразу учтётся
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new AppException('TOKEN_INVALID', 'Пользователь не найден', HttpStatus.UNAUTHORIZED);
    }
    req.user = user;
    return true;
  }
}
