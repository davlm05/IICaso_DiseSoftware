import { create } from "zustand";
import { client } from "../api/client";
import { clearTokens, getAccessToken, setTokens } from "../api/tokenStore";
import type { AuthResult, AuthSessionStatus, ProfileResponse, Role, UserDTO } from "../types";

/**
 * Auth store — Singleton (README §1.3 `AuthSessionStore` / `AuthService`).
 * Holds the authenticated user and session status, backed by the real API:
 * `POST /auth/login|register|logout` for tokens (persisted in expo-secure-store
 * via the axios interceptors) and `GET /users/me` for the profile + points
 * balance. `PATCH /users/me` updates name/phone.
 */

export interface AuthState {
  status: AuthSessionStatus;
  user: UserDTO | null;
  /** True once the initial token-hydration check has run. */
  hydrated: boolean;

  /** Restore a persisted session on app start (token → GET /users/me). */
  initialize: () => Promise<void>;
  /** POST /auth/login → store tokens → GET /users/me. Throws on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** POST /auth/logout + clear SecureStore. */
  logout: () => Promise<void>;
  /** POST /auth/register → store tokens → GET /users/me. */
  register: (data: { email: string; password: string; fullName: string }) => Promise<UserDTO>;
  /** PATCH /users/me — backend accepts fullName/phone only. */
  updateUser: (data: Partial<UserDTO> & { password?: string }) => Promise<void>;
  /** SUPER_ADMIN "Crear usuario" flow — creates a user without touching the session. */
  createUser: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: Role;
  }) => Promise<UserDTO>;
}

function toUser(profile: ProfileResponse): UserDTO {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    role: profile.role,
    createdAt: profile.createdAt,
    pointsBalance: profile.pointsBalance,
  };
}

async function fetchProfile(): Promise<UserDTO> {
  const { data } = await client.get<ProfileResponse>("/users/me");
  return toUser(data);
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "ANONYMOUS",
  user: null,
  hydrated: false,

  initialize: async () => {
    const token = await getAccessToken();
    if (!token) {
      set({ status: "ANONYMOUS", user: null, hydrated: true });
      return;
    }
    try {
      const user = await fetchProfile();
      set({ status: "AUTHENTICATED", user, hydrated: true });
    } catch {
      await clearTokens();
      set({ status: "ANONYMOUS", user: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    const { data } = await client.post<AuthResult>("/auth/login", { email, password });
    await setTokens(data.accessToken, data.refreshToken);
    const user = await fetchProfile();
    set({ status: "AUTHENTICATED", user });
  },

  logout: async () => {
    try {
      await client.post("/auth/logout");
    } catch {
      // Logout is stateless server-side (MVP); ignore network errors.
    }
    await clearTokens();
    set({ status: "ANONYMOUS", user: null });
  },

  register: async ({ email, password, fullName }) => {
    const { data } = await client.post<AuthResult>("/auth/register", { email, password, fullName });
    await setTokens(data.accessToken, data.refreshToken);
    const user = await fetchProfile();
    set({ status: "AUTHENTICATED", user });
    return user;
  },

  updateUser: async (data) => {
    // Backend PATCH /users/me only accepts fullName + phone (strict schema).
    const { data: profile } = await client.patch<ProfileResponse>("/users/me", {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    });
    set({ user: toUser(profile) });
  },

  createUser: async ({ email, password, fullName, phone, role }) => {
    // No admin-create endpoint in the MVP; reuse public register. The created
    // account is a USER server-side (role/phone are not persisted by register)
    // and the current session is left untouched (tokens from this call ignored).
    const { data } = await client.post<AuthResult>("/auth/register", { email, password, fullName });
    return {
      id: data.user.id,
      email: data.user.email,
      fullName,
      phone,
      role,
      createdAt: new Date().toISOString(),
    };
  },
}));
