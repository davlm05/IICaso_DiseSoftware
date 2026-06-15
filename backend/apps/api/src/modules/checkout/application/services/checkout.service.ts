import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type {
  QrTicketResponse,
  SessionDTO,
  ValidateSessionRequest,
} from '@smartcart/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CatalogService } from '../../../catalog/application/services/catalog.service';
import { PrismaPointsRepository } from '../../infrastructure/repositories/prisma-points.repository';
import { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import {
  InvalidQrTokenError,
  InvalidTransitionError,
  QrItemMismatchError,
  SessionNotFoundError,
} from '../../domain/errors/checkout.errors';
import { QrTicketFactory } from '../../domain/factories/qr-ticket.factory';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '../interfaces/event-publisher.interface';
import {
  QR_SIGNER,
  type IQrSigner,
} from '../interfaces/qr-signer.interface';
import {
  SESSION_REPOSITORY,
  type ISessionRepository,
} from '../interfaces/session-repository.interface';
import { PointsService } from './points.service';
import { toSessionDTO } from '../../infrastructure/mappers/session.mapper';

export interface ValidationResult {
  sessionId: string;
  status: string;
  pointsAwarded: number;
}

/**
 * Checkout orchestration (README §2.3 §2/§4, §2.8 Workflow 1 & 4).
 * Owns the create → scan → QR → POS-validate → credit flow. The validate path
 * runs in a Prisma `$transaction` so session completion + the points ledger
 * entry commit atomically; the analytics event is published only after commit.
 */
@Injectable()
export class CheckoutService {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(QR_SIGNER) private readonly qrSigner: IQrSigner,
    @Inject(EVENT_PUBLISHER) private readonly events: IEventPublisher,
    private readonly points: PointsService,
    private readonly catalog: CatalogService,
    private readonly pointsRepo: PrismaPointsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createSession(userId: string, storeId: string): Promise<SessionDTO> {
    const session = await this.sessions.create(userId, storeId);
    return toSessionDTO(session);
  }

  async getActive(userId: string): Promise<SessionDTO | null> {
    const session = await this.sessions.findActiveByUser(userId);
    return session ? toSessionDTO(session) : null;
  }

  async getById(userId: string, sessionId: string): Promise<SessionDTO> {
    const session = await this.requireOwned(userId, sessionId);
    return toSessionDTO(session);
  }

  async addItem(
    userId: string,
    sessionId: string,
    barcode: string,
    quantity: number,
  ): Promise<SessionDTO> {
    const session = await this.requireOwned(userId, sessionId);
    if (session.status !== 'ACTIVE') {
      throw new InvalidTransitionError('Items can only be added to an ACTIVE session');
    }

    const product = await this.catalog.findByBarcode(barcode);
    const pointsValue = this.points.pointsForItem(product.pointsConfig, quantity);

    const updated = await this.sessions.addItem(sessionId, {
      productId: product.id,
      barcode,
      quantity,
      pointsValue,
    });
    return toSessionDTO(updated);
  }

  async removeItem(
    userId: string,
    sessionId: string,
    itemId: string,
  ): Promise<SessionDTO> {
    const session = await this.requireOwned(userId, sessionId);
    if (session.status !== 'ACTIVE') {
      throw new InvalidTransitionError('Items can only be removed from an ACTIVE session');
    }
    const updated = await this.sessions.removeItem(sessionId, itemId);
    return toSessionDTO(updated);
  }

  /** ACTIVE → PENDING_CHECKOUT + signed QR (README §2.3 §2). */
  async generateQr(
    userId: string,
    sessionId: string,
  ): Promise<QrTicketResponse> {
    const session = await this.requireOwned(userId, sessionId);
    const ticket = QrTicketFactory.create(session, this.qrSigner); // mutates + guards
    await this.sessions.markPendingCheckout(sessionId, session.itemHash as string);
    return { token: ticket.token, expiresAt: ticket.expiresAt.toISOString() };
  }

  /**
   * POS validation (README §2.8 Workflow 1). Verifies the QR signature/expiry,
   * compares the scanned cart against the embedded hash, then atomically marks
   * the session COMPLETED and credits points.
   */
  async validateSession(
    sessionId: string,
    dto: ValidateSessionRequest,
  ): Promise<ValidationResult> {
    const payload = this.qrSigner.verify(dto.qrToken);
    if (payload.sessionId !== sessionId) throw new InvalidQrTokenError();

    const session = await this.sessions.findById(sessionId);
    if (!session) throw new SessionNotFoundError();
    if (session.status !== 'PENDING_CHECKOUT') {
      throw new InvalidTransitionError(
        `Session ${sessionId} is not awaiting validation`,
      );
    }

    // Anti-tamper hash compare. On mismatch → VALIDATION_FAILED, then surface.
    try {
      session.validateItems(dto.scannedItems);
    } catch (err) {
      if (err instanceof QrItemMismatchError) {
        session.markValidationFailed();
        await this.prisma.shoppingSession.update({
          where: { id: sessionId },
          data: { status: 'VALIDATION_FAILED' },
        });
      }
      throw err;
    }

    const pointsAwarded = this.points.calculateSessionTotal(session);

    await this.prisma.$transaction(async (tx) => {
      await tx.shoppingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' },
      });
      if (pointsAwarded > 0) {
        await this.pointsRepo.creditPurchase(tx, {
          userId: session.userId,
          sessionId,
          delta: pointsAwarded,
        });
      }
    });
    session.completeValidation();

    // Side effect AFTER commit (README §2.3 §1 step 1).
    await this.events.publish({
      userId: session.userId,
      storeId: session.storeId,
      sessionId,
      items: session.items.map((i) => ({
        barcode: i.barcode,
        quantity: i.quantity,
        pointsValue: i.pointsValue,
      })),
      pointsAwarded,
      timestamp: new Date().toISOString(),
    });

    return { sessionId, status: session.status, pointsAwarded };
  }

  private async requireOwned(
    userId: string,
    sessionId: string,
  ): Promise<ShoppingSession> {
    const session = await this.sessions.findById(sessionId);
    if (!session) throw new SessionNotFoundError();
    if (session.userId !== userId) {
      // Don't reveal existence of another user's session.
      throw new ForbiddenException('Not your session');
    }
    return session;
  }
}
