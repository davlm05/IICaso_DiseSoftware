import { SetMetadata } from '@nestjs/common';
import type { Role } from '@smartcart/shared-types';

/** Metadata key read by `RolesGuard` (README §2.5 A01). */
export const ROLES_KEY = 'roles';

/** `@Roles('USER', ...)` — restrict a handler/controller to the listed roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
