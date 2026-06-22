import { z } from 'zod';

/**
 * Session-domain Zod schemas. Source of truth: README §2.3 (Points / strategies),
 * §2.4 (Data Model) and §2.8 Workflow 1 (validate). DTO interfaces in
 * `../dto/session.dto.ts` are inferred from these schemas so the two cannot drift.
 */

// EAN-8/13 barcode — exact pattern from README §2.5 A08 (anchored, length-capped, ReDoS-safe).
export const BarcodeSchema = z.string().regex(/^\d{8,14}$/).max(14);

export const SessionStatusSchema = z.enum([
  'ACTIVE',
  'PENDING_CHECKOUT',
  'COMPLETED',
  'VALIDATION_FAILED',
  'EXPIRED',
]);

// pointsConfig discriminated union — shapes from README §2.3 "Strategy Types" table.
export const PointsConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('FIXED_PER_UNIT'), value: z.number() }),
  z.object({ type: z.literal('SPEND_MULTIPLIER'), value: z.number() }),
  z.object({
    type: z.literal('VOLUME_TIER'),
    tiers: z.array(
      z.object({
        minQty: z.number().int(),
        maxQty: z.number().int(),
        pointsPerUnit: z.number().int(),
      }),
    ),
  }),
  z.object({
    type: z.literal('WEEKEND_BONUS'),
    basePoints: z.number().int(),
    weekendMultiplier: z.number(),
  }),
]);

export const ProductDTOSchema = z.object({
  id: z.string().uuid(),
  barcode: BarcodeSchema,
  name: z.string(),
  brand: z.string(),
  imageUrl: z.string().url().optional(),
  pointsConfig: PointsConfigSchema,
  sponsored: z.boolean(),
});

export const SessionItemDTOSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  barcode: BarcodeSchema,
  quantity: z.number().int().positive(),
  pointsValue: z.number().int(),
});

export const SessionDTOSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  status: SessionStatusSchema,
  items: z.array(SessionItemDTOSchema),
  itemHash: z.string().optional(),
  createdAt: z.string().datetime(), // ISO-8601
  updatedAt: z.string().datetime(),
});

// ── Inbound request schemas ────────────────────────────────────────────────
export const CreateSessionRequestSchema = z.object({
  storeId: z.string().uuid(),
});

export const AddItemRequestSchema = z.object({
  barcode: BarcodeSchema,
  quantity: z.number().int().positive(),
});

// Exact shape from README §2.8 Workflow 1, step 2.
export const ValidateSessionRequestSchema = z.object({
  qrToken: z.string(),
  scannedItems: z.array(z.string()),
});

export const QrTicketResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(), // ISO-8601; 10-minute window per README §2.3
});
