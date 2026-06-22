import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  IUnitOfWork,
  TransactionContext,
} from '../../application/interfaces/unit-of-work.interface';

/**
 * Prisma-backed Unit of Work (README §2.2 ACID directive, §2.8 Workflow 1).
 * Wraps `prisma.$transaction` with an interactive callback so the application
 * gets atomicity without importing PrismaClient itself.
 */
@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}
