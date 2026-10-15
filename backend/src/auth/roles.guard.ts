import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { forbidden } from '../common/errors/app.exception';
import type { User, UserRole } from '../users/user.entity';

/**
 * Проверяет роль пользователя. Ставится ПОСЛЕ JwtAuthGuard:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('club_admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;

    const user: User | undefined = ctx.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) {
      throw forbidden('FORBIDDEN', 'Недостаточно прав');
    }
    return true;
  }
}
