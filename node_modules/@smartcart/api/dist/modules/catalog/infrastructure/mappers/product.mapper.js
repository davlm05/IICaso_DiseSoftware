"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProductDTO = toProductDTO;
function toProductDTO(row) {
    return {
        id: row.id,
        barcode: row.barcode,
        name: row.name,
        brand: row.brand,
        imageUrl: row.imageUrl ?? undefined,
        pointsConfig: row.pointsConfig,
        sponsored: row.sponsored,
    };
}
//# sourceMappingURL=product.mapper.js.map