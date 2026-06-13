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
