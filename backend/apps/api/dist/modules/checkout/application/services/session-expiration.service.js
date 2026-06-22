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
exports.SessionExpirationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const session_repository_interface_1 = require("../interfaces/session-repository.interface");
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
let SessionExpirationService = class SessionExpirationService {
    constructor(sessions) {
        this.sessions = sessions;
        this.logger = new common_1.Logger('SessionExpiration');
    }
    async expireStaleSessions() {
        const cutoff = new Date(Date.now() - TWO_HOURS_MS);
        const stale = await this.sessions.findActiveOlderThan(cutoff);
        if (stale.length === 0)
            return;
        for (const session of stale) {
            session.expire();
            await this.sessions.markExpired(session.id);
        }
        this.logger.log(`Expired ${stale.length} stale session(s)`);
    }
};
exports.SessionExpirationService = SessionExpirationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionExpirationService.prototype, "expireStaleSessions", null);
exports.SessionExpirationService = SessionExpirationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SessionExpirationService);
//# sourceMappingURL=session-expiration.service.js.map