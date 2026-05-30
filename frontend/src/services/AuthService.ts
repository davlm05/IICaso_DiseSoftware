/**
 * Servicio de autenticación (mock).
 *
 * Genera un JWT SIMULADO (sin verificación criptográfica real) para ejercitar
 * el flujo de login/sesión. En Fase 3 lo emite el backend y se valida server-side.
 */
import { MOCK_USER } from '@/services/mock/db'
import { delay } from '@/services/mock/delay'

type AuthResult = { token: string; user: typeof MOCK_USER }

/** base64url sin padding (variante usada por JWT). */
function base64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Inverso de base64url para decodificar el payload. */
function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  return atob(padded)
}

/** Construye un JWT simulado para el usuario demo. */
function buildToken(): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1_000)
  const payload = {
    sub: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    iat,
    exp: iat + 3_600, // expira en 1 hora
  }
  const signature = base64Url('mock-signature')
  return `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}.${signature}`
}

export const AuthService = {
  /** Login con email/password (no se validan credenciales en el mock). */
  async login(_email: string, _password: string): Promise<AuthResult> {
    await delay()
    return { token: buildToken(), user: MOCK_USER }
  },

  /** Login de demostración: entra como el usuario mock sin password. */
  async loginDemo(): Promise<AuthResult> {
    await delay()
    return { token: buildToken(), user: MOCK_USER }
  },

  /** Decodifica el payload del JWT; null si el token es inválido. */
  decodeToken(token: string): { exp: number; sub: string } | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    try {
      const payload = JSON.parse(fromBase64Url(parts[1])) as { exp: number; sub: string }
      return { exp: payload.exp, sub: payload.sub }
    } catch {
      return null
    }
  },

  /** Indica si el token expiró (o es inválido). */
  isExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return true
    return decoded.exp <= Math.floor(Date.now() / 1_000)
  },
}
