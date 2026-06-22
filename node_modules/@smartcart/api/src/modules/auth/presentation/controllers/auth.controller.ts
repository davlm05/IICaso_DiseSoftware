import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  LoginRequest,
  LoginRequestSchema,
  RefreshRequest,
  RefreshRequestSchema,
  RegisterRequest,
  RegisterRequestSchema,
} from '@smartcart/shared-types';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { AuthService } from '../../application/services/auth.service';

/** Auth endpoints (README §2.4 / §2.8 Workflow 3). Tokens returned in the body. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) dto: RegisterRequest,
  ) {
    const { user, tokens } = await this.auth.register(dto);
    return { ...tokens, user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest,
  ) {
    const { user, tokens } = await this.auth.login(dto);
    return { ...tokens, user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body(new ZodValidationPipe(RefreshRequestSchema)) dto: RefreshRequest,
  ) {
    const { user, tokens } = await this.auth.refresh(dto.refreshToken);
    return { ...tokens, user };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RefreshRequestSchema)) dto: RefreshRequest,
  ): Promise<void> {
    await this.auth.logout(user.sub, dto.refreshToken);
  }
}
