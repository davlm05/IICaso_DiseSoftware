/**
 * Frontend types. Two groups:
 *  - **Display DTOs** (`ProductDTO`, `RewardDTO`, …): the shapes the screens
 *    read. A mapping layer (`src/api/mappers.ts`) adapts the backend payloads
 *    into these so screens don't change when the contract differs.
 *  - **Backend DTOs** (`BackendProduct`, `BackendSession`, …): mirror the
 *    NestJS responses / `packages/shared-types` (README §2.4 Data Contracts).
 */

// ── Roles (canonical taxonomy — matches packages/shared-types RoleSchema) ─────
export const ROLES = [
  "USER",
  "BACKOFFICE_OPERATOR",
  "CATALOG_MANAGER",
  "STORE_ADMIN",
  "SUPER_ADMIN",
] as const;
export type Role = (typeof ROLES)[number];

export type AuthSessionStatus = "ANONYMOUS" | "AUTHENTICATED" | "LOADING";

export type SessionStatus =
  | "ACTIVE"
  | "PENDING_CHECKOUT"
  | "COMPLETED"
  | "VALIDATION_FAILED"
  | "EXPIRED";

// ── Display DTOs (consumed by screens) ────────────────────────────────────────
export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  createdAt: string;
  /** Derived from the points ledger by GET /users/me. */
  pointsBalance?: number;
}

export interface ProductDTO {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  price: number;
  points: number;
  iconName: string;
  sponsored: boolean;
  /** Session line-item id (present once added to a session — used for DELETE). */
  itemId?: string;
}

export interface RewardDTO {
  id: string;
  name: string;
  description: string;
  cost: number;
  expiresInDays?: number;
  highlighted?: boolean;
}

export interface CouponDTO {
  id: string;
  name: string;
  code: string;
  expiresAt?: string;
}

// ── Backend DTOs (mirror the NestJS responses / packages/shared-types) ────────
export type PointsConfig =
  | { type: "FIXED_PER_UNIT"; value: number }
  | { type: "SPEND_MULTIPLIER"; value: number }
  | {
      type: "VOLUME_TIER";
      tiers: { minQty: number; maxQty: number; pointsPerUnit: number }[];
    }
  | { type: "WEEKEND_BONUS"; basePoints: number; weekendMultiplier: number };

export interface BackendProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  pointsConfig: PointsConfig;
  sponsored: boolean;
}

export interface BackendSessionItem {
  id: string;
  productId: string;
  barcode: string;
  quantity: number;
  pointsValue: number;
}

export interface BackendSession {
  id: string;
  userId: string;
  storeId: string;
  status: SessionStatus;
  items: BackendSessionItem[];
  itemHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  imageUrl?: string;
  active: boolean;
}

export interface QrTicket {
  token: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/** GET /users/me */
export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  createdAt: string;
  pointsBalance: number;
}

/** GET /users/me/points/history */
export interface PointsHistoryItem {
  id: string;
  delta: number;
  reason: string;
  sessionId?: string;
  createdAt: string;
}

export interface PointsHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  items: PointsHistoryItem[];
}

/** POST /rewards/:id/redeem */
export interface RedemptionResponse {
  id: string;
  rewardId: string;
  rewardName: string;
  couponCode: string;
  status: string;
  redeemedAt: string;
  remainingBalance: number;
}
