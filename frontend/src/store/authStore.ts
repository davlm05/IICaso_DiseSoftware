import { create } from "zustand";
import type { AuthSessionStatus, Role, UserDTO } from "../types";

/**
 * Auth store — Singleton (README §1.3 `AuthSessionStore` / `AuthService`,
 * §1.9 `/store/`). Holds the authenticated user and session status.
 *
 * In production this is backed by `POST /auth/login`, `POST /auth/register`,
 * and `PATCH /users/me`, with `accessToken`/`refreshToken` persisted in
 * expo-secure-store via `ITokenStore` (never AsyncStorage). Here the network
 * calls are mocked locally so the screens are fully navigable.
 */

export interface AuthState {
  status: AuthSessionStatus;
  user: UserDTO | null;

  /** AuthService.login(email, password) -> AuthUser */
  login: (email: string, password: string) => boolean;
  /** AuthService.logout() */
  logout: () => void;
  /** POST /auth/register — { email, password, fullName } */
  register: (data: { email: string; password: string; fullName: string }) => UserDTO;
  /** PATCH /users/me — { email, fullName, password?, phone?, role? } */
  updateUser: (data: Partial<UserDTO> & { password?: string }) => void;
  /** Convenience for the "Crear usuario" flow (SUPER_ADMIN only). */
  createUser: (data: { email: string; password: string; fullName: string; phone?: string; role: Role }) => UserDTO;
}

const MOCK_USER: UserDTO = {
  id: "u-jose-castro",
  email: "jose.castro@example.com",
  fullName: "José Castro",
  phone: "+506 8888-0000",
  role: "USER",
  createdAt: "2026-01-15T10:00:00Z",
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "ANONYMOUS",
  user: null,

  login: (email, _password) => {
    // Mock: any non-empty email/password succeeds and loads the mock user.
    set({ status: "AUTHENTICATED", user: { ...MOCK_USER, email } });
    return true;
  },

  logout: () => set({ status: "ANONYMOUS", user: null }),

  register: ({ email, fullName }) => {
    const newUser: UserDTO = {
      id: `u-${Date.now()}`,
      email,
      fullName,
      role: "USER",
      createdAt: new Date().toISOString(),
    };
    set({ status: "AUTHENTICATED", user: newUser });
    return newUser;
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : state.user,
    })),

  createUser: ({ email, fullName, phone, role }) => {
    // SUPER_ADMIN-only flow (see EditUserScreen). Does not change the
    // currently authenticated session — returns the newly created user.
    return {
      id: `u-${Date.now()}`,
      email,
      fullName,
      phone,
      role,
      createdAt: new Date().toISOString(),
    };
  },
}));
