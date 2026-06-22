import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin DI wrapper over the generated Prisma client. The single point of database
 * access for the API (README §2.1 ORM/DB, §2.5 A03 — 100% parameterized queries).
 * `$disconnect()` is called by the graceful-shutdown handler in `main.ts` (§2.7).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
