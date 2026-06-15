import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@smartcart/shared-types';

/** Shape attached to `req.user` by the JWT strategy. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

/**
 * `@CurrentUser()` — pulls the authenticated principal off the request
 * (populated by JwtStrategy.validate). Keeps controllers free of `req` access.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthenticatedUser;
  },
);
