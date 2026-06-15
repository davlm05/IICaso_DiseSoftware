/**
 * Local shape of the shared DTOs from packages/shared-types, scoped to what
 * the frontend screens need. Mirrors ProductDTO / SessionDTO / RewardDTO.
 */

export type SessionStatus =
  | "ACTIVE"
  | "PENDING_CHECKOUT"
  | "COMPLETED"
  | "VALIDATION_FAILED"
  | "EXPIRED";

export interface ProductDTO {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  price: number;
  points: number;
  iconName: string;
  sponsored: boolean;
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

/**
 * Role enum (README §1.3 Authorization / RBAC, data model `User.role`).
 * `USER` is the only role this consumer app authenticates by default;
 * the rest are back-office roles, included here so `EditUserScreen` can
 * gate role editing for `SUPER_ADMIN`.
 */
export type Role = "USER" | "BACKOFFICE_OPERATOR" | "CATALOG_MANAGER" | "STORE_ADMIN" | "SUPER_ADMIN";

export const ROLES: Role[] = ["USER", "BACKOFFICE_OPERATOR", "CATALOG_MANAGER", "STORE_ADMIN", "SUPER_ADMIN"];

/**
 * UserDTO — mirrors the `User` entity fields from the README data model
 * (§"Database design"): id, email, fullName, passwordHash, phone?,
 * pushToken?, role, createdAt. `passwordHash` is never exposed to the
 * client; the frontend only ever sends/receives a plain `password` field
 * on register/login/update, per `/auth/register`, `/auth/login`, and
 * `PATCH /users/me`.
 */
export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

export type AuthSessionStatus = "ANONYMOUS" | "AUTHENTICATED" | "REFRESHING" | "EXPIRED";

