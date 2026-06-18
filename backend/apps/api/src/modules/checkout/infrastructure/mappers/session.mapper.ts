import type { SessionItem, ShoppingSession as PrismaSession } from '@prisma/client';
import type { SessionDTO } from '@smartcart/shared-types';
import { ShoppingSession } from '../../domain/entities/shopping-session.entity';

type PrismaSessionWithItems = PrismaSession & { items: SessionItem[] };

/**
 * Maps Prisma rows ↔ domain entity ↔ shared DTO (README §2.2 Rule 3).
 * The application/domain layers never touch Prisma types.
 */
export function toDomain(row: PrismaSessionWithItems): ShoppingSession {
  return ShoppingSession.reconstitute({
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

export function toSessionDTO(
  session: ShoppingSession,
  updatedAt: Date = new Date(),
): SessionDTO {
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
