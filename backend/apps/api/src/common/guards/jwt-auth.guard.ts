import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects routes that require a logged-in shopper (README §2.4 "Auth: Yes (JWT)").
 * Backed by the `jwt` Passport strategy (see auth/infrastructure/jwt.strategy.ts).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
