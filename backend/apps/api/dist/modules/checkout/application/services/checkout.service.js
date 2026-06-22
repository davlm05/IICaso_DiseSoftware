"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const catalog_service_1 = require("../../../catalog/application/services/catalog.service");
const prisma_points_repository_1 = require("../../infrastructure/repositories/prisma-points.repository");
const checkout_errors_1 = require("../../domain/errors/checkout.errors");
const qr_ticket_factory_1 = require("../../domain/factories/qr-ticket.factory");
const event_publisher_interface_1 = require("../interfaces/event-publisher.interface");
const qr_signer_interface_1 = require("../interfaces/qr-signer.interface");
const session_repository_interface_1 = require("../interfaces/session-repository.interface");
const points_service_1 = require("./points.service");
const session_mapper_1 = require("../../infrastructure/mappers/session.mapper");
let CheckoutService = class CheckoutService {
    constructor(sessions, qrSigner, events, points, catalog, pointsRepo, prisma) {
        this.sessions = sessions;
        this.qrSigner = qrSigner;
        this.events = events;
        this.points = points;
        this.catalog = catalog;
        this.pointsRepo = pointsRepo;
        this.prisma = prisma;
    }
    async createSession(userId, storeId) {
        const session = await this.sessions.create(userId, storeId);
        return (0, session_mapper_1.toSessionDTO)(session);
    }
    async getActive(userId) {
        const session = await this.sessions.findActiveByUser(userId);
        return session ? (0, session_mapper_1.toSessionDTO)(session) : null;
    }
    async getById(userId, sessionId) {
        const session = await this.requireOwned(userId, sessionId);
        return (0, session_mapper_1.toSessionDTO)(session);
    }
    async addItem(userId, sessionId, barcode, quantity) {
        const session = await this.requireOwned(userId, sessionId);
        if (session.status !== 'ACTIVE') {
            throw new checkout_errors_1.InvalidTransitionError('Items can only be added to an ACTIVE session');
        }
        const product = await this.catalog.findByBarcode(barcode);
        const pointsValue = this.points.pointsForItem(product.pointsConfig, quantity);
        const updated = await this.sessions.addItem(sessionId, {
            productId: product.id,
            barcode,
            quantity,
            pointsValue,
        });
        return (0, session_mapper_1.toSessionDTO)(updated);
    }
    async removeItem(userId, sessionId, itemId) {
        const session = await this.requireOwned(userId, sessionId);
        if (session.status !== 'ACTIVE') {
            throw new checkout_errors_1.InvalidTransitionError('Items can only be removed from an ACTIVE session');
        }
        const updated = await this.sessions.removeItem(sessionId, itemId);
        return (0, session_mapper_1.toSessionDTO)(updated);
    }
    async generateQr(userId, sessionId) {
        const session = await this.requireOwned(userId, sessionId);
        const ticket = qr_ticket_factory_1.QrTicketFactory.create(session, this.qrSigner);
        await this.sessions.markPendingCheckout(sessionId, session.itemHash);
        return { token: ticket.token, expiresAt: ticket.expiresAt.toISOString() };
    }
    async validateSession(sessionId, dto) {
        const payload = this.qrSigner.verify(dto.qrToken);
        if (payload.sessionId !== sessionId)
            throw new checkout_errors_1.InvalidQrTokenError();
        const session = await this.sessions.findById(sessionId);
        if (!session)
            throw new checkout_errors_1.SessionNotFoundError();
        if (session.status !== 'PENDING_CHECKOUT') {
            throw new checkout_errors_1.InvalidTransitionError(`Session ${sessionId} is not awaiting validation`);
        }
        try {
            session.validateItems(dto.scannedItems);
        }
        catch (err) {
            if (err instanceof checkout_errors_1.QrItemMismatchError) {
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
    async requireOwned(userId, sessionId) {
        const session = await this.sessions.findById(sessionId);
        if (!session)
            throw new checkout_errors_1.SessionNotFoundError();
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('Not your session');
        }
        return session;
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(qr_signer_interface_1.QR_SIGNER)),
    __param(2, (0, common_1.Inject)(event_publisher_interface_1.EVENT_PUBLISHER)),
    __metadata("design:paramtypes", [Object, Object, Object, points_service_1.PointsService,
        catalog_service_1.CatalogService,
        prisma_points_repository_1.PrismaPointsRepository,
        prisma_service_1.PrismaService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map