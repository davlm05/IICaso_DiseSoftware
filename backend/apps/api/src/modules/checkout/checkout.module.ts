import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CheckoutService } from './application/services/checkout.service';
import { PointsService } from './application/services/points.service';
import { PointsStrategyResolver } from './application/services/points-strategy-resolver';
import { SessionExpirationService } from './application/services/session-expiration.service';
import { EVENT_PUBLISHER } from './application/interfaces/event-publisher.interface';
import { QR_SIGNER } from './application/interfaces/qr-signer.interface';
import { SESSION_REPOSITORY } from './application/interfaces/session-repository.interface';
import { JwtQrSigner } from './infrastructure/crypto/jwt-qr.signer';
import { LoggingEventPublisher } from './infrastructure/events/bullmq-event.publisher';
import { PrismaPointsRepository } from './infrastructure/repositories/prisma-points.repository';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { QrController } from './presentation/controllers/qr.controller';
import { SessionController } from './presentation/controllers/session.controller';
import { ValidationController } from './presentation/controllers/validation.controller';

/**
 * Checkout bounded context (README §2.2/§2.3). Interface tokens are bound to
 * their infrastructure implementations here, so application services depend on
 * abstractions only (Dependency Inversion).
 */
@Module({
  imports: [CatalogModule],
  controllers: [SessionController, QrController, ValidationController],
  providers: [
    CheckoutService,
    PointsService,
    PointsStrategyResolver,
    SessionExpirationService,
    PrismaPointsRepository,
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: QR_SIGNER, useClass: JwtQrSigner },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
  ],
})
export class CheckoutModule {}
