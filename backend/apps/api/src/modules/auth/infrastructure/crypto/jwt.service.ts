import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@smartcart/shared-types';
import * as jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Issues and verifies the access/refresh JWT pair (README §2.5 Authentication,
 * token transport = response body + expo-secure-store, no cookies).
 * Access and refresh use independent secrets so a leaked access secret cannot
 * mint refresh tokens.
 */
@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  signAccess(payload: AccessTokenPayload): string {
    const secret: jwt.Secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const options: jwt.SignOptions = {
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, secret, options);
  }

  signRefresh(payload: { sub: string }): string {
    const secret: jwt.Secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const options: jwt.SignOptions = {
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '30d') as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, secret, options);
  }

  verifyRefresh(token: string): { sub: string } {
    const secret: jwt.Secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    return jwt.verify(token, secret) as { sub: string };
  }
}
