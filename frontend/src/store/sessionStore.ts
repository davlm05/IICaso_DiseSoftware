import { create } from "zustand";
import type { ProductDTO, SessionStatus } from "../types";

/**
 * Session store — Singleton (README §1.4 Application / Use Cases).
 *
 * Holds the single active shopping session: pending items, accrued points,
 * checkout status, and the location-verification gate. Consumed via
 * selective selectors (e.g. `useSessionStore((s) => s.pendingPoints)`) to
 * avoid whole-store re-renders (README §1.6 Memoization).
 */

export interface SessionState {
  status: SessionStatus | "IDLE";
  storeName: string;
  locationVerified: boolean;
  creditedPoints: number;
  nextRewardAt: number;
  pendingItems: ProductDTO[];
  lastAddedId: string | null;
  qrToken: string | null;
  qrFallbackCode: string | null;
  qrExpiresAt: number | null;

  // Derived helpers
  pendingPoints: () => number;

  // Command-backed mutations (README §1.4 Command pattern + undo)
  addItem: (product: ProductDTO) => void;
  removeItem: (id: string) => void;
  generateQr: () => void;
  confirmValidation: () => void;
  redeemReward: (cost: number) => void;
  reset: () => void;
}

const INITIAL: Pick<
  SessionState,
  | "status"
  | "storeName"
  | "locationVerified"
  | "creditedPoints"
  | "nextRewardAt"
  | "pendingItems"
  | "lastAddedId"
  | "qrToken"
  | "qrFallbackCode"
  | "qrExpiresAt"
> = {
  status: "ACTIVE",
  storeName: "Super Buen Precio — Curridabat",
  locationVerified: true,
  creditedPoints: 120,
  nextRewardAt: 200,
  pendingItems: [],
  lastAddedId: null,
  qrToken: null,
  qrFallbackCode: null,
  qrExpiresAt: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...INITIAL,

  pendingPoints: () => get().pendingItems.reduce((sum, p) => sum + p.points, 0),

  // AddItemCommand.execute() — validated upstream by the scan Chain of Responsibility
  addItem: (product) =>
    set((state) => ({
      pendingItems: [...state.pendingItems, product],
      lastAddedId: product.id,
    })),

  // RemoveProductCommand.execute() — supports undo via re-adding in the feature container
  removeItem: (id) =>
    set((state) => ({
      pendingItems: state.pendingItems.filter((p) => p.id !== id),
      lastAddedId: state.lastAddedId === id ? null : state.lastAddedId,
    })),

  // GenerateQRCommand.execute() — non-idempotent; transitions ACTIVE -> PENDING_CHECKOUT
  generateQr: () =>
    set(() => ({
      status: "PENDING_CHECKOUT",
      qrToken: "SC-2026-AX9K-7283-TOKEN",
      qrFallbackCode: "SC-2026-AX9K-7283",
      qrExpiresAt: Date.now() + 10 * 60 * 1000,
    })),

  // Triggered by socket/poll on POS validation success — transitions to COMPLETED
  confirmValidation: () =>
    set((state) => ({
      status: "COMPLETED",
      creditedPoints: state.creditedPoints + state.pendingPoints(),
    })),

  // RedeemCouponCommand.execute() — non-idempotent
  redeemReward: (cost) =>
    set((state) => ({
      creditedPoints: Math.max(state.creditedPoints - cost, 0),
    })),

  reset: () =>
    set(() => ({
      ...INITIAL,
    })),
}));
