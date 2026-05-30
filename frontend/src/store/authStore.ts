/**
 * authStore — autenticación (JWT mock).
 *
 * Persiste el token en sessionStorage ('sc_token') y enlaza su lectura al
 * apiClient vía setAuthTokenGetter, de modo que cada request adjunte el token
 * vigente sin acoplar el cliente HTTP al store.
 */
import { create } from 'zustand'
import { AuthService, setAuthTokenGetter } from '@/services'
import { MOCK_USER } from '@/services/mock/db'

/** Clave de almacenamiento del token de sesión. */
const TOKEN_KEY = 'sc_token'

interface AuthStore {
  token: string | null
  user: typeof MOCK_USER | null
  isAuthenticated: boolean
  login(email: string, password: string): Promise<void>
  loginDemo(): Promise<void>
  logout(): void
  checkSession(): void
}

// Token inicial leído de sessionStorage (sesión persistida entre recargas).
const initialToken = sessionStorage.getItem(TOKEN_KEY)

export const useAuthStore = create<AuthStore>()((set, get) => {
  // Enlaza el token vigente al apiClient (se evalúa en cada request).
  setAuthTokenGetter(() => get().token)

  return {
    token: initialToken,
    user: initialToken ? MOCK_USER : null,
    isAuthenticated: Boolean(initialToken),

    // Login con credenciales; persiste token y usuario.
    login: async (email, password) => {
      const { token, user } = await AuthService.login(email, password)
      sessionStorage.setItem(TOKEN_KEY, token)
      set({ token, user, isAuthenticated: true })
    },

    // Login de demostración (sin credenciales).
    loginDemo: async () => {
      const { token, user } = await AuthService.loginDemo()
      sessionStorage.setItem(TOKEN_KEY, token)
      set({ token, user, isAuthenticated: true })
    },

    // Cierra sesión y limpia el token persistido.
    logout: () => {
      sessionStorage.removeItem(TOKEN_KEY)
      set({ token: null, user: null, isAuthenticated: false })
    },

    // Cierra sesión si el token vigente expiró.
    checkSession: () => {
      const { token, logout } = get()
      if (token && AuthService.isExpired(token)) logout()
    },
  }
})
