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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const pointsBalance = await this.getBalance(userId);
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone ?? undefined,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            pointsBalance,
        };
    }
    async updateProfile(userId, input) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { fullName: input.fullName, phone: input.phone },
        });
        return this.getProfile(userId);
    }
    async getPointsHistory(userId, limit = 20, offset = 0) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.pointsTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.pointsTransaction.count({ where: { userId } }),
        ]);
        return {
            total,
            limit,
            offset,
            items: items.map((t) => ({
                id: t.id,
                delta: t.delta,
                reason: t.reason,
                sessionId: t.sessionId ?? undefined,
                createdAt: t.createdAt.toISOString(),
            })),
        };
    }
    async getBalance(userId) {
        const agg = await this.prisma.pointsTransaction.aggregate({
            where: { userId },
            _sum: { delta: true },
        });
        return agg._sum.delta ?? 0;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map