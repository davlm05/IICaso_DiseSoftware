import { create } from "zustand";
import axios from "axios";
import { client } from "../api/client";
import { DEFAULT_STORE_ID } from "../api/config";
import { buildPendingItems, cacheProduct } from "../api/mappers";
import type { BackendSession, ProductDTO, ProfileResponse, RedemptionResponse, SessionStatus } from "../types";

/**
 * Session store — Singleton (README §1.4 Application / Use Cases).
 *
 * Holds the single active shopping session. Mutations are async thunks over the
 * API: `POST/GET /sessions`, `POST/DELETE /sessions/:id/items`,
 * `POST /sessions/:id/qr`, with the credited-points balance derived from
 * `GET /users/me`. The Command objects in `sessionCommands.ts` wrap these.
 * Consumed via selective selectors to avoid whole-store re-renders (README §1.6).
 */

export interface SessionState {
  status: SessionStatus | "IDLE";
  sessionId: string | null;
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

  // Async thunks (each wraps an API call; Command objects dispatch these)
  ensureSession: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  addItem: (product: ProductDTO) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  generateQr: () => Promise<void>;
  /** GET /sessions/:id once — used by checkout polling. Returns the status. */
  pollStatus: () => Promise<SessionStatus | null>;
  /** Marks the session COMPLETED locally and refreshes the credited balance. */
  confirmValidation: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  reset: () => void;
}

const INITIAL = {
  status: "IDLE" as SessionStatus | "IDLE",
  sessionId: null as string | null,
  // No GET /stores endpoint in the MVP — name mirrors the seeded store.
  storeName: "Super Buen Precio — Curridabat",
  // No geofence in the MVP; treated as verified.
  locationVerified: true,
  nextRewardAt: 200,
  pendingItems: [] as ProductDTO[],
  lastAddedId: null as string | null,
  qrToken: null as string | null,
  qrFallbackCode: null as string | null,
  qrExpiresAt: null as number | null,
};

function applySession(session: BackendSession) {
  return {
    sessionId: session.id,
    status: session.status,
    pendingItems: buildPendingItems(session.items),
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...INITIAL,
  creditedPoints: 0,

  pendingPoints: () => get().pendingItems.reduce((sum, p) => sum + p.points, 0),

  // GET /sessions/active → if none (404) POST /sessions with the seeded store.
  ensureSession: async () => {
    if (get().sessionId && get().status === "ACTIVE") return;
    try {
      const { data } = await client.get<BackendSession>("/sessions/active");
      set(applySession(data));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        const { data } = await client.post<BackendSession>("/sessions", {
          storeId: DEFAULT_STORE_ID,
        });
        set(applySession(data));
      } else {
        throw err;
      }
    }
  },

  refreshBalance: async () => {
    const { data } = await client.get<ProfileResponse>("/users/me");
    set({ creditedPoints: data.pointsBalance });
  },

  // AddItemCommand.execute() — POST /sessions/:id/items {barcode, quantity}.
  addItem: async (product) => {
    await get().ensureSession();
    const sessionId = get().sessionId;
    if (!sessionId) throw new Error("No active session");
    cacheProduct(product); // keep name/icon for the pending list
    const { data } = await client.post<BackendSession>(`/sessions/${sessionId}/items`, {
      barcode: product.barcode,
      quantity: 1,
    });
    set({ ...applySession(data), lastAddedId: product.id });
  },

  // RemoveProductCommand.execute() — DELETE /sessions/:id/items/:itemId.
  removeItem: async (id) => {
    const { sessionId, pendingItems } = get();
    const target = pendingItems.find((p) => p.id === id);
    if (!sessionId || !target?.itemId) {
      // Nothing persisted yet — drop locally.
      set((state) => ({
        pendingItems: state.pendingItems.filter((p) => p.id !== id),
        lastAddedId: state.lastAddedId === id ? null : state.lastAddedId,
      }));
      return;
    }
    const { data } = await client.delete<BackendSession>(
      `/sessions/${sessionId}/items/${target.itemId}`,
    );
    set({
      ...applySession(data),
      lastAddedId: get().lastAddedId === id ? null : get().lastAddedId,
    });
  },

  // GenerateQRCommand.execute() — POST /sessions/:id/qr (ACTIVE → PENDING_CHECKOUT).
  generateQr: async () => {
    await get().ensureSession();
    const sessionId = get().sessionId;
    if (!sessionId) throw new Error("No active session");
    const { data } = await client.post<{ token: string; expiresAt: string }>(
      `/sessions/${sessionId}/qr`,
    );
    set({
      status: "PENDING_CHECKOUT",
      qrToken: data.token,
      // Human-readable fallback shown under the QR (the token is a long JWT).
      qrFallbackCode: data.token.slice(0, 16).toUpperCase(),
      qrExpiresAt: Date.parse(data.expiresAt),
    });
  },

  // Polling fallback (no WebSocket in the MVP — CLAUDE.md). Returns the status.
  pollStatus: async () => {
    const sessionId = get().sessionId;
    if (!sessionId) return null;
    const { data } = await client.get<BackendSession>(`/sessions/${sessionId}`);
    set({ status: data.status, pendingItems: buildPendingItems(data.items) });
    return data.status;
  },

  confirmValidation: async () => {
    set({ status: "COMPLETED" });
    await get().refreshBalance();
  },

  // RedeemCouponCommand.execute() — POST /rewards/:id/redeem (non-idempotent).
  redeemReward: async (rewardId) => {
    const { data } = await client.post<RedemptionResponse>(`/rewards/${rewardId}/redeem`);
    set({ creditedPoints: data.remainingBalance });
  },

  // Clears the cart/QR for the next trip; keeps the credited balance.
  reset: () =>
    set(() => ({
      ...INITIAL,
      creditedPoints: get().creditedPoints,
    })),
}));
