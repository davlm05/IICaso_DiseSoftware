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
exports.ValidationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_types_1 = require("@smartcart/shared-types");
const api_key_decorator_1 = require("../../../../common/decorators/api-key.decorator");
const api_key_guard_1 = require("../../../../common/guards/api-key.guard");
const zod_validation_pipe_1 = require("../../../../common/pipes/zod-validation.pipe");
const checkout_service_1 = require("../../application/services/checkout.service");
let ValidationController = class ValidationController {
    constructor(checkout) {
        this.checkout = checkout;
    }
    validate(id, dto) {
        return this.checkout.validateSession(id, dto);
    }
};
exports.ValidationController = ValidationController;
__decorate([
    (0, common_1.Post)(':id/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(shared_types_1.ValidateSessionRequestSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ValidationController.prototype, "validate", null);
exports.ValidationController = ValidationController = __decorate([
    (0, swagger_1.ApiTags)('pos'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, api_key_decorator_1.RequireApiKey)('POS'),
    (0, common_1.Controller)({ path: 'sessions', version: '1' }),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], ValidationController);
//# sourceMappingURL=validation.controller.js.map