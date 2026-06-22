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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_types_1 = require("@smartcart/shared-types");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const catalog_service_1 = require("../../application/services/catalog.service");
let ProductsController = class ProductsController {
    constructor(catalog) {
        this.catalog = catalog;
    }
    search(q, limit) {
        if (!q || q.trim().length === 0) {
            throw new common_1.BadRequestException('Query parameter "q" is required');
        }
        return this.catalog.search(q.trim(), limit ? Number(limit) : 20);
    }
    byBarcode(barcode) {
        const parsed = shared_types_1.BarcodeSchema.safeParse(barcode);
        if (!parsed.success)
            throw new common_1.BadRequestException('Invalid barcode');
        return this.catalog.findByBarcode(parsed.data);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':barcode'),
    __param(0, (0, common_1.Param)('barcode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "byBarcode", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)({ path: 'products', version: '1' }),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map