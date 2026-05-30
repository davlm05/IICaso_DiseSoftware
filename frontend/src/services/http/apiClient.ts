/**
 * Cliente HTTP ligero sobre `fetch`.
 *
 * Placeholder de la capa de red: en Fase 3 se reemplaza por Axios con
 * interceptores (auth, refresh de token, manejo centralizado de errores).
 * En esta fase los servicios mock NO hacen peticiones reales; este cliente
 * existe para fijar la interfaz que consumirá el código futuro.
 */

/** Getter del token de auth inyectado desde el store (evita acoplar al storage). */
let authTokenGetter: () => string | null = () => null

/** Registra la función que provee el token de autenticación actual. */
export function setAuthTokenGetter(fn: () => string | null): void {
  authTokenGetter = fn
}

export const apiClient = {
  /**
   * Ejecuta una petición y deserializa la respuesta a `T`.
   * Inyecta el header `Authorization: Bearer <token>` si hay token disponible.
   * Lanza `Error` ante un status 401 (no autorizado).
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = authTokenGetter()

    // Mezcla headers del caller con el header de auth (si aplica).
    const headers = new Headers(options.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(path, { ...options, headers })

    if (response.status === 401) {
      throw new Error('No autorizado (401)')
    }

    return (await response.json()) as T
  },
}
