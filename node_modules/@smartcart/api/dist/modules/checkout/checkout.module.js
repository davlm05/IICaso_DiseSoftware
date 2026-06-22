"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutModule = void 0;
const common_1 = require("@nestjs/common");
const catalog_module_1 = require("../catalog/catalog.module");
const checkout_service_1 = require("./application/services/checkout.service");
const points_service_1 = require("./application/services/points.service");
const points_strategy_resolver_1 = require("./application/services/points-strategy-resolver");
const session_expiration_service_1 = require("./application/services/session-expiration.service");
const event_publisher_interface_1 = require("./application/interfaces/event-publisher.interface");
const qr_signer_interface_1 = require("./application/interfaces/qr-signer.interface");
const session_repository_interface_1 = require("./application/interfaces/session-repository.interface");
const jwt_qr_signer_1 = require("./infrastructure/crypto/jwt-qr.signer");
const bullmq_event_publisher_1 = require("./infrastructure/events/bullmq-event.publisher");
const prisma_points_repository_1 = require("./infrastructure/repositories/prisma-points.repository");
const prisma_session_repository_1 = require("./infrastructure/repositories/prisma-session.repository");
const qr_controller_1 = require("./presentation/controllers/qr.controller");
const session_controller_1 = require("./presentation/controllers/session.controller");
const validation_controller_1 = require("./presentation/controllers/validation.controller");
let CheckoutModule = class CheckoutModule {
};
exports.CheckoutModule = CheckoutModule;
exports.CheckoutModule = CheckoutModule = __decorate([
    (0, common_1.Module)({
        imports: [catalog_module_1.CatalogModule],
        controllers: [session_controller_1.SessionController, qr_controller_1.QrController, validation_controller_1.ValidationController],
        providers: [
            checkout_service_1.CheckoutService,
            points_service_1.PointsService,
            points_strategy_resolver_1.PointsStrategyResolver,
            session_expiration_service_1.SessionExpirationService,
            prisma_points_repository_1.PrismaPointsRepository,
            { provide: session_repository_interface_1.SESSION_REPOSITORY, useClass: prisma_session_repository_1.PrismaSessionRepository },
            { provide: qr_signer_interface_1.QR_SIGNER, useClass: jwt_qr_signer_1.JwtQrSigner },
            { provide: event_publisher_interface_1.EVENT_PUBLISHER, useClass: bullmq_event_publisher_1.LoggingEventPublisher },
        ],
    })
], CheckoutModule);
//# sourceMappingURL=checkout.module.js.map