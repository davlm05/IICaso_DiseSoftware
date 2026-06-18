import { Injectable } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  ISessionRepository,
  NewSessionItem,
} from '../../application/interfaces/session-repository.interface';
import { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import { SessionNotFoundError } from '../../domain/errors/checkout.errors';
import { toDomain } from '../mappers/session.mapper';

const WITH_ITEMS = { items: true } as const;

/** Prisma-backed ISessionRepository (README §2.2 infrastructure layer). */
@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, storeId: string): Promise<ShoppingSession> {
    const row = await this.prisma.shoppingSession.create({
      data: { userId, storeId, status: SessionStatus.ACTIVE },
      include: WITH_ITEMS,
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<ShoppingSession | null> {
    const row = await this.prisma.shoppingSession.findUnique({
      where: { id },
      include: WITH_ITEMS,
    });
    return row ? toDomain(row) : null;
  }

  async findActiveByUser(userId: string): Promise<ShoppingSession | null> {
    const row = await this.prisma.shoppingSession.findFirst({
      where: { userId, status: SessionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: WITH_ITEMS,
    });
    return row ? toDomain(row) : null;
  }

  async addItem(
    sessionId: string,
    item: NewSessionItem,
  ): Promise<ShoppingSession> {
    await this.ensureExists(sessionId);
    await this.prisma.sessionItem.create({
      data: { sessionId, ...item },
    });
    return this.requireById(sessionId);
  }

  async removeItem(
    sessionId: string,
    itemId: string,
  ): Promise<ShoppingSession> {
    await this.prisma.sessionItem.deleteMany({
      where: { id: itemId, sessionId },
    });
    return this.requireById(sessionId);
  }

  async markPendingCheckout(
    sessionId: string,
    itemHash: string,
  ): Promise<void> {
    await this.prisma.shoppingSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.PENDING_CHECKOUT, itemHash },
    });
  }

  async findActiveOlderThan(cutoff: Date): Promise<ShoppingSession[]> {
    const rows = await this.prisma.shoppingSession.findMany({
      where: { status: SessionStatus.ACTIVE, createdAt: { lt: cutoff } },
      include: WITH_ITEMS,
    });
    return rows.map(toDomain);
  }

  async markExpired(sessionId: string): Promise<void> {
    await this.prisma.shoppingSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.EXPIRED },
    });
  }

  private async ensureExists(sessionId: string): Promise<void> {
    const count = await this.prisma.shoppingSession.count({
      where: { id: sessionId },
    });
    if (count === 0) throw new SessionNotFoundError();
  }

  private async requireById(sessionId: string): Promise<ShoppingSession> {
    const session = await this.findById(sessionId);
    if (!session) throw new SessionNotFoundError();
    return session;
  }
}
