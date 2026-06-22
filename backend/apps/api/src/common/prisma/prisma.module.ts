import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global so every module shares one connection pool (README §2.7 PgBouncer). */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
