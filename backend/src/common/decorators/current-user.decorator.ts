import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../users/user.entity';

/**
 * @CurrentUser() — достаёт пользователя, которого JwtAuthGuard положил в request.
 * Пример: getMe(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest().user,
);
