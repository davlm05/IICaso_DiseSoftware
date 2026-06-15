import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/services/auth.service';
import { PasswordService } from './infrastructure/crypto/password.service';
import { TokenService } from './infrastructure/crypto/jwt.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtStrategy],
  exports: [PasswordService],
})
export class AuthModule {}
