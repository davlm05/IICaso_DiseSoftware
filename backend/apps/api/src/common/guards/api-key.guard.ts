import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ApiKeyType } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { API_KEY_TYPE } from '../decorators/api-key.decorator';

/**
 * Non-JWT auth for POS / B2B surfaces (README §2.4, §2.5 ApiKey model).
 * The client sends a plaintext key in `x-api-key`; we SHA-256 it and look up
 * a matching, type-scoped row in the ApiKey table (keys are never stored raw).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredType = this.reflector.getAllAndOverride<ApiKeyType>(
      API_KEY_TYPE,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredType) return true;

    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-api-key'] as string | undefined;
    if (!provided) throw new UnauthorizedException('Missing x-api-key header');

    const hashedKey = createHash('sha256').update(provided).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { hashedKey } });

    if (!apiKey || apiKey.type !== requiredType) {
      throw new UnauthorizedException('Invalid API key');
    }

    req.apiKey = { id: apiKey.id, type: apiKey.type, storeId: apiKey.storeId };
    return true;
  }
}
