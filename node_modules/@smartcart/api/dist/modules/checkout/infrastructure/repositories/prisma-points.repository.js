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
exports.PrismaPointsRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let PrismaPointsRepository = class PrismaPointsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    creditPurchase(tx, params) {
        return tx.pointsTransaction.create({
            data: {
                userId: params.userId,
                sessionId: params.sessionId,
                delta: params.delta,
                reason: client_1.PointsReason.PURCHASE,
            },
        });
    }
    async getBalance(userId) {
        const agg = await this.prisma.pointsTransaction.aggregate({
            where: { userId },
            _sum: { delta: true },
        });
        return agg._sum.delta ?? 0;
    }
};
exports.PrismaPointsRepository = PrismaPointsRepository;
exports.PrismaPointsRepository = PrismaPointsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPointsRepository);
//# sourceMappingURL=prisma-points.repository.js.map