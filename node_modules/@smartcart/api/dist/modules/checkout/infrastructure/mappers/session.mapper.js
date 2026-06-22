"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDomain = toDomain;
exports.toSessionDTO = toSessionDTO;
const shopping_session_entity_1 = require("../../domain/entities/shopping-session.entity");
function toDomain(row) {
    return shopping_session_entity_1.ShoppingSession.reconstitute({
        id: row.id,
        userId: row.userId,
        storeId: row.storeId,
        status: row.status,
        itemHash: row.itemHash,
        createdAt: row.createdAt,
        items: row.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            barcode: i.barcode,
            quantity: i.quantity,
            pointsValue: i.pointsValue,
        })),
    });
}
function toSessionDTO(session, updatedAt = new Date()) {
    return {
        id: session.id,
        userId: session.userId,
        storeId: session.storeId,
        status: session.status,
        itemHash: session.itemHash ?? undefined,
        createdAt: session.createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        items: session.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            barcode: i.barcode,
            quantity: i.quantity,
            pointsValue: i.pointsValue,
        })),
    };
}
//# sourceMappingURL=session.mapper.js.map