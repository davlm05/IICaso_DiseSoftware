import { Module } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { USER_REPOSITORY } from './application/interfaces/user-repository.interface';
import { JwtTokenService } from './infrastructure/crypto/jwt.service';
import { PasswordService } from './infrastructure/crypto/password.service';
import { PrismaUserRepository } from './infrastructure/repositories/user.repository';
import { AuthController } from './presentation/controllers/auth.controller';

/** Auth module — DI bindings for the authentication workflow (README §2.5/§2.8). */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    PasswordService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [JwtTokenService],
})
export class AuthModule {}
