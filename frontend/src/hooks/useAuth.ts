/**
 * Hook de autenticación.
 *
 * Envuelve el `useAuthStore` y verifica la vigencia de la sesión al montar
 * (checkSession). Reexpone el estado y las acciones que la UI necesita.
 */
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/** Conecta la UI con el estado de autenticación. */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)
  const loginDemo = useAuthStore((s) => s.loginDemo)
  const logout = useAuthStore((s) => s.logout)
  const checkSession = useAuthStore((s) => s.checkSession)

  // Al montar: cierra la sesión si el token expiró.
  useEffect(() => {
    checkSession()
  }, [checkSession])

  return { user, isAuthenticated, login, loginDemo, logout }
}
