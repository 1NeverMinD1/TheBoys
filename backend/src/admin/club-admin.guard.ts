import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { forbidden } from '../common/errors/app.exception';
import type { User } from '../users/user.entity';

/**
 * Пускает только админа ИМЕННО ЭТОГО клуба: роль club_admin и
 * user.clubId совпадает с :clubId из адреса. Ставится после JwtAuthGuard.
 * Так админ Pixel Hub не сможет поменять цены в Respawn Arena.
 */
@Injectable()
export class ClubAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user: User | undefined = req.user;
    const clubId: string | undefined = req.params.clubId;

    if (!user || user.role !== 'club_admin') throw forbidden('FORBIDDEN', 'Доступно только администраторам клубов');
    if (clubId && user.clubId !== clubId) throw forbidden('NOT_YOUR_CLUB', 'Вы не администратор этого клуба');
    return true;
  }
}
