"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingEventPublisher = void 0;
const common_1 = require("@nestjs/common");
let LoggingEventPublisher = class LoggingEventPublisher {
    constructor() {
        this.logger = new common_1.Logger('CheckoutCompletedEvent');
    }
    async publish(event) {
        this.logger.log(`checkout.completed user=${event.userId} store=${event.storeId} ` +
            `session=${event.sessionId} points=${event.pointsAwarded}`);
    }
};
exports.LoggingEventPublisher = LoggingEventPublisher;
exports.LoggingEventPublisher = LoggingEventPublisher = __decorate([
    (0, common_1.Injectable)()
], LoggingEventPublisher);
//# sourceMappingURL=bullmq-event.publisher.js.map