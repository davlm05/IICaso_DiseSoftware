import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@smartcart/shared-types';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Verifies the `Authorization: Bearer <access>` JWT and attaches the claims to
 * `request.user` (README §2.5 Authentication). An expired/invalid token → 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessSecret: string;

  constructor(config: ConfigService) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    const token = header.slice('Bearer '.length);
    try {
      const claims = jwt.verify(token, this.accessSecret) as {
        sub: string;
        role: Role;
      };
      (request as Request & { user: unknown }).user = {
        sub: claims.sub,
        role: claims.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
