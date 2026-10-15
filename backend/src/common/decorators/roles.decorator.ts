import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';

/** @Roles('club_admin') — доступ только для указанных ролей (работает вместе с RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
