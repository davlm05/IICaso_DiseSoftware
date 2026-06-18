import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@smartcart/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PasswordService } from '../../infrastructure/crypto/password.service';
import { TokenService } from '../../infrastructure/crypto/jwt.service';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Auth orchestration (README §2.8 Workflow 3). Owns register/login/refresh.
 * Tokens are returned in the response body (no cookies) per README §2.5.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthResult> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, fullName: dto.fullName, passwordHash },
    });
    return this.issue(user);
  }

  async login(dto: LoginRequest): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Compare even on missing user is overkill here; a generic error avoids
    // leaking which emails exist (README §2.5 A07).
    if (!user || !(await this.passwords.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issue(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let sub: string;
    try {
      ({ sub } = this.tokens.verifyRefresh(refreshToken));
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return this.issue(user);
  }

  /**
   * Stateless logout. MVP scope: JWTs are not server-side revoked (the full
   * §2.5 design adds a refresh-token denylist in Redis). Clients drop the
   * tokens from expo-secure-store.
   */
  async logout(): Promise<void> {
    return;
  }

  private issue(user: {
    id: string;
    email: string;
    role: AuthUser['role'];
  }): AuthResult {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.tokens.signAccess({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      refreshToken: this.tokens.signRefresh({ sub: user.id }),
      user: authUser,
    };
  }
}
