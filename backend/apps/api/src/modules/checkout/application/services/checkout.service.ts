import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AddItemRequest,
  MockPayResponse,
  QrTicketResponse,
  SessionDTO,
} from '@smartcart/shared-types';
import { BusinessMetricsService } from '../../../../common/metrics/business-metrics.service';
import {
  CATALOG_SERVICE,
  ICatalogService,
} from '../../../catalog/application/interfaces/catalog-service.interface';
import { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import { QrItemMismatchError } from '../../domain/errors/checkout.errors';
import { QrTicketFactory } from '../../domain/factories/qr-ticket.factory';
import {
  EVENT_PUBLISHER,
  IEventPublisher,
} from '../interfaces/event-publisher.interface';
import {
  IPointsRepository,
  POINTS_REPOSITORY,
} from '../interfaces/points-repository.interface';
import { IQrSigner, QR_SIGNER } from '../interfaces/qr-signer.interface';
import {
  ISessionNotifier,
  SESSION_NOTIFIER,
} from '../interfaces/session-notifier.interface';
import {
  ISessionRepository,
  SESSION_REPOSITORY,
} from '../interfaces/session-repository.interface';
import {
  IUnitOfWork,
  UNIT_OF_WORK,
} from '../interfaces/unit-of-work.interface';
import { PointsService } from './points.service';

export interface ValidateSessionInput {
  qrToken: string;
  scannedItems: string[];
}

export interface ValidateSessionResult {
  sessionId: string;
  status: SessionDTO['status'];
  pointsAwarded: number;
  newBalance: number;
}

/**
 * CheckoutService — the application orchestrator for the session lifecycle
 * (README §2.2, §2.3, §2.8 Workflows 1 & 4). Owns the ACID transaction boundary;
 * delegates all business math to the domain entity, strategies, and state machine.
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(POINTS_REPOSITORY) private readonly points: IPointsRepository,
    @Inject(QR_SIGNER) private readonly qrSigner: IQrSigner,
    @Inject(EVENT_PUBLISHER) private readonly events: IEventPublisher,
    @Inject(SESSION_NOTIFIER) private readonly notifier: ISessionNotifier,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(CATALOG_SERVICE) private readonly catalog: ICatalogService,
    private readonly pointsService: PointsService,
    private readonly metrics: BusinessMetricsService,
    private readonly config: ConfigService,
  ) {}

  // ── Workflow 4: session creation & scanning ─────────────────────────────────

  /** Create a new ACTIVE session; at most one per user (README §2.8 W4.1). */
  async createSession(userId: string, storeId: string): Promise<SessionDTO> {
    const existing = await this.sessions.findActiveByUser(userId);
    if (existing) {
      throw new ConflictException('User already has an active session.');
    }
    const session = ShoppingSession.create({
      id: randomUUID(),
      userId,
      storeId,
    });
    await this.sessions.save(session);
    return this.toDto(session);
  }

  /** Add a scanned item; ownership + ACTIVE guard enforced (README §2.8 W4.3). */
  async addItem(
    sessionId: string,
    userId: string,
    dto: AddItemRequest,
  ): Promise<SessionDTO> {
    const session = await this.loadOwned(sessionId, userId);
    const product = await this.catalog.getByBarcode(dto.barcode);

    // Freeze the per-line pending points now, via the Strategy pattern.
    // NOTE: the README schema does not persist a product price, so SPEND_MULTIPLIER
    // prices the line at 0 here; wire `unitPrice` through when price is added.
    const pointsValue = this.pointsService.calculateForItem(
      { quantity: dto.quantity, unitPrice: 0 },
      product.pointsConfig,
    );

    session.addItem({
      id: randomUUID(),
      productId: product.id,
      barcode: product.barcode,
      quantity: dto.quantity,
      pointsValue,
      unitPrice: 0,
    });
    await this.sessions.save(session);
    return this.toDto(session);
  }

  /** Remove a line; ownership + ACTIVE guard (README §2.8 W4.4). */
  async removeItem(
    sessionId: string,
    userId: string,
    itemId: string,
  ): Promise<SessionDTO> {
    const session = await this.loadOwned(sessionId, userId);
    session.removeItem(itemId); // throws ItemNotFoundError if absent
    await this.sessions.save(session);
    return this.toDto(session);
  }

  /** Read a session for receipt/history; ownership enforced. */
  async getSession(sessionId: string, userId: string): Promise<SessionDTO> {
    const session = await this.loadOwned(sessionId, userId);
    return this.toDto(session);
  }

  /** The user's currently ACTIVE session, or null. */
  async getActiveSession(userId: string): Promise<SessionDTO | null> {
    const session = await this.sessions.findActiveByUser(userId);
    return session ? this.toDto(session) : null;
  }

  /** Generate a checkout QR; freezes the cart (README §2.8 W4.5). */
  async generateQr(
    sessionId: string,
    userId: string,
  ): Promise<QrTicketResponse> {
    const session = await this.loadOwned(sessionId, userId);
    // Factory transitions ACTIVE → PENDING_CHECKOUT, hashes the cart, signs JWT.
    const ticket = QrTicketFactory.create(session, this.qrSigner);
    await this.sessions.save(session);
    this.metrics.recordQrGenerated();
    return { token: ticket.token, expiresAt: ticket.expiresAt.toISOString() };
  }

  // ── Workflow 1: POS validation (atomic, replay-safe) ────────────────────────

  /**
   * Validate a checkout QR and credit points atomically (README §2.8 Workflow 1).
   * @param scopedStoreId  storeId the POS API key is scoped to (must match).
   */
  async validateSession(
    sessionId: string,
    input: ValidateSessionInput,
    scopedStoreId?: string,
  ): Promise<ValidateSessionResult> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    // POS key must be scoped to this session's store (README W1 rule).
    if (scopedStoreId && scopedStoreId !== session.storeId) {
      throw new ForbiddenException('API key is not scoped to this store.');
    }

    // Verify signature + expiry (throws QrTokenExpired / InvalidQrToken).
    const claims = this.qrSigner.verify(input.qrToken);
    if (claims.sessionId !== sessionId) {
      throw new ForbiddenException('QR token does not match this session.');
    }

    // Replay-safety: only PENDING_CHECKOUT may validate. completeValidation()
    // throws InvalidTransitionError for COMPLETED / EXPIRED / VALIDATION_FAILED.
    try {
      session.validateItems(input.scannedItems);
    } catch (err) {
      if (err instanceof QrItemMismatchError) {
        session.markValidationFailed(); // PENDING_CHECKOUT → VALIDATION_FAILED
        await this.sessions.save(session);
      }
      throw err;
    }

    const pointsAwarded = this.pointsService.calculatePoints(session);

    // Atomic: complete the session, persist it, and append the ledger row —
    // all-or-nothing. No external I/O inside the transaction (README §2.2).
    await this.uow.runInTransaction(async (tx) => {
      session.completeValidation(); // PENDING_CHECKOUT → COMPLETED
      await this.sessions.save(session, tx);
      await this.points.creditPoints(
        {
          userId: session.userId,
          delta: pointsAwarded,
          reason: 'PURCHASE',
          sessionId: session.id,
        },
        tx,
      );
    });

    const newBalance = await this.points.getBalance(session.userId);

    // ── Post-commit side effects — best-effort, never roll back the sale. ──
    void this.publishSideEffects(session, pointsAwarded);

    this.logger.log({
      event: 'AUDIT',
      action: 'validateSession',
      userId: session.userId,
      sessionId: session.id,
      pointsAwarded,
    });

    return {
      sessionId: session.id,
      status: session.status,
      pointsAwarded,
      newBalance,
    };
  }

  // ── Mock pay (dev/demo only) ────────────────────────────────────────────────

  /**
   * Mock checkout (README §2.5 A04/A05, backend spec §5). Drives a
   * PENDING_CHECKOUT session the caller owns to COMPLETED and credits the frozen
   * points, reusing the exact atomic boundary + state machine of the real
   * `validateSession()` flow — but WITHOUT the POS API key / QR signature / item
   * hash checks, because its purpose is to simulate the POS for demos. Disabled
   * in production behind `MOCK_PAY_ENABLED` so it can never become a points-minting
   * bypass of the real POS path; when off the endpoint is invisible (404).
   *
   * Replay-safety + idempotency are guaranteed purely by the domain state machine:
   * `completeValidation()` throws `InvalidTransitionError` for any non-
   * PENDING_CHECKOUT status, so a double-tap of the pay button never double-credits.
   */
  async mockPay(sessionId: string, userId: string): Promise<MockPayResponse> {
    // 1. Feature gate — invisible in production (README §2.5 A05).
    if (this.config.get<boolean>('MOCK_PAY_ENABLED') !== true) {
      throw new NotFoundException('Session not found.');
    }

    // 2. Load + ownership (README §2.5 A01, §2.8 W4 ownership rule).
    const session = await this.loadOwned(sessionId, userId);

    // 3. Points — same Strategy-pattern path as real validation (sponsored skipped).
    const pointsAwarded = this.pointsService.calculatePoints(session);

    // 4. State machine + ACID transaction (replay-safe). No external I/O inside.
    await this.uow.runInTransaction(async (tx) => {
      session.completeValidation(); // PENDING_CHECKOUT → COMPLETED (guarded)
      await this.sessions.save(session, tx);
      await this.points.creditPoints(
        {
          userId: session.userId,
          delta: pointsAwarded,
          reason: 'PURCHASE',
          sessionId: session.id,
        },
        tx,
      );
    });

    const newBalance = await this.points.getBalance(session.userId);

    // 5. Post-commit side effects — best-effort, never roll back the sale.
    void this.publishSideEffects(session, pointsAwarded);

    this.logger.log({
      event: 'AUDIT',
      action: 'mockPay',
      userId: session.userId,
      sessionId: session.id,
      pointsAwarded,
    });

    // 6. Return the simulated-settlement contract.
    return {
      sessionId: session.id,
      status: session.status,
      pointsAwarded,
      newBalance,
      mock: true,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async publishSideEffects(
    session: ShoppingSession,
    pointsAwarded: number,
  ): Promise<void> {
    try {
      this.metrics.recordCheckout(pointsAwarded);
      this.notifier.notifyStatusChanged({
        sessionId: session.id,
        status: session.status,
        pointsAwarded,
      });
      await this.events.publish({
        sessionId: session.id,
        userId: session.userId,
        storeId: session.storeId,
        pointsAwarded,
        items: session.items.map((i) => ({
          productId: i.productId,
          barcode: i.barcode,
          quantity: i.quantity,
          pointsValue: i.pointsValue,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // A failed side effect must not fail the (already-committed) checkout.
      this.logger.warn(
        `Post-commit side effect failed for session ${session.id}: ${String(err)}`,
      );
    }
  }

  private async loadOwned(
    sessionId: string,
    userId: string,
  ): Promise<ShoppingSession> {
    const session = await this.sessions.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not own this session.');
    }
    return session;
  }

  private toDto(session: ShoppingSession): SessionDTO {
    return {
      id: session.id,
      userId: session.userId,
      storeId: session.storeId,
      status: session.status,
      itemHash: session.itemHash ?? undefined,
      items: session.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        barcode: i.barcode,
        quantity: i.quantity,
        pointsValue: i.pointsValue,
      })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }
}
