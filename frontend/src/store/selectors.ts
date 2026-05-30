/**
 * Selectores de la sesión — funciones puras sobre el estado de sessionStore.
 *
 * Derivan valores (puntos pendientes, totales, vista de estado) sin almacenarlos,
 * evitando estado redundante. Se consumen con `useSessionStore(selectX)`.
 */
import type { SessionStateView } from '@/domain/models/types'
import { getSessionState } from '@/domain/states'
import type { SessionState } from './sessionStore'

/**
 * Puntos pendientes: suma de los ofrecidos por productos aún no validados.
 * Solo depende de `products`, por lo que admite el estado completo o un subset.
 */
export function selectPendingPoints(s: Pick<SessionState, 'products'>): number {
  return s.products
    .filter((p) => !p.validated)
    .reduce((sum, p) => sum + p.pointsOffered, 0)
}

/** Cantidad de productos en la sesión. */
export function selectProductCount(s: SessionState): number {
  return s.products.length
}

/** Total gastado: suma de los precios de los productos. */
export function selectTotalSpent(s: SessionState): number {
  return s.products.reduce((sum, p) => sum + p.price, 0)
}

/** Vista (singleton) del estado actual de la sesión. */
export function selectState(s: SessionState): SessionStateView {
  return getSessionState(s.stateName)
}

/** Indica si se puede generar el QR (estado lo permite y hay productos). */
export function selectCanGenerateQr(s: SessionState): boolean {
  return getSessionState(s.stateName).canGenerateQr && s.products.length > 0
}
