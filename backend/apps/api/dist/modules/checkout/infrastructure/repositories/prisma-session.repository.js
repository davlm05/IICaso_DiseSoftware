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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSessionRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const checkout_errors_1 = require("../../domain/errors/checkout.errors");
const session_mapper_1 = require("../mappers/session.mapper");
const WITH_ITEMS = { items: true };
let PrismaSessionRepository = class PrismaSessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, storeId) {
        const row = await this.prisma.shoppingSession.create({
            data: { userId, storeId, status: client_1.SessionStatus.ACTIVE },
            include: WITH_ITEMS,
        });
        return (0, session_mapper_1.toDomain)(row);
    }
    async findById(id) {
        const row = await this.prisma.shoppingSession.findUnique({
            where: { id },
            include: WITH_ITEMS,
        });
        return row ? (0, session_mapper_1.toDomain)(row) : null;
    }
    async findActiveByUser(userId) {
        const row = await this.prisma.shoppingSession.findFirst({
            where: { userId, status: client_1.SessionStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            include: WITH_ITEMS,
        });
        return row ? (0, session_mapper_1.toDomain)(row) : null;
    }
    async addItem(sessionId, item) {
        await this.ensureExists(sessionId);
        await this.prisma.sessionItem.create({
            data: { sessionId, ...item },
        });
        return this.requireById(sessionId);
    }
    async removeItem(sessionId, itemId) {
        await this.prisma.sessionItem.deleteMany({
            where: { id: itemId, sessionId },
        });
        return this.requireById(sessionId);
    }
    async markPendingCheckout(sessionId, itemHash) {
        await this.prisma.shoppingSession.update({
            where: { id: sessionId },
            data: { status: client_1.SessionStatus.PENDING_CHECKOUT, itemHash },
        });
    }
    async findActiveOlderThan(cutoff) {
        const rows = await this.prisma.shoppingSession.findMany({
            where: { status: client_1.SessionStatus.ACTIVE, createdAt: { lt: cutoff } },
            include: WITH_ITEMS,
        });
        return rows.map(session_mapper_1.toDomain);
    }
    async markExpired(sessionId) {
        await this.prisma.shoppingSession.update({
            where: { id: sessionId },
            data: { status: client_1.SessionStatus.EXPIRED },
        });
    }
    async ensureExists(sessionId) {
        const count = await this.prisma.shoppingSession.count({
            where: { id: sessionId },
        });
        if (count === 0)
            throw new checkout_errors_1.SessionNotFoundError();
    }
    async requireById(sessionId) {
        const session = await this.findById(sessionId);
        if (!session)
            throw new checkout_errors_1.SessionNotFoundError();
        return session;
    }
};
exports.PrismaSessionRepository = PrismaSessionRepository;
exports.PrismaSessionRepository = PrismaSessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSessionRepository);
//# sourceMappingURL=prisma-session.repository.js.map