/**
 * State (GoF) — barrel de los estados de la sesión de compra.
 *
 * Diagrama de transiciones:
 *
 *   empty ──scan──▶ withProducts ──generateQr──▶ validating ──confirm──▶ confirmed
 *     ▲                  │                                                   │
 *     └──── vaciar ──────┘                                                   │
 *                        ◀──────────────── scan (nueva compra) ─────────────┘
 *
 *   (scanning es un estado transitorio durante la captura del barcode; al
 *    resolverse deriva en withProducts o vuelve a empty.)
 *
 * `getSessionState` expone instancias singleton inmutables por nombre.
 * `resolveStateName` deriva el nombre del estado a partir de la sesión.
 */
import type { SessionStateName, SessionStateView } from '@/domain/models/types'
import { EmptyState } from './EmptyState'
import { ScanningState } from './ScanningState'
import { WithProductsState } from './WithProductsState'
import { ValidatingState } from './ValidatingState'
import { ConfirmedState } from './ConfirmedState'

export { BaseSessionState } from './SessionState'
export { EmptyState } from './EmptyState'
export { ScanningState } from './ScanningState'
export { WithProductsState } from './WithProductsState'
export { ValidatingState } from './ValidatingState'
export { ConfirmedState } from './ConfirmedState'

/** Mapa de instancias singleton: un único objeto inmutable por estado. */
const STATES: Readonly<Record<SessionStateName, SessionStateView>> = {
  empty: new EmptyState(),
  scanning: new ScanningState(),
  withProducts: new WithProductsState(),
  validating: new ValidatingState(),
  confirmed: new ConfirmedState(),
}

/** Devuelve la vista (singleton) del estado solicitado. */
export function getSessionState(name: SessionStateName): SessionStateView {
  return STATES[name]
}

/**
 * Deriva el nombre del estado a partir de la situación de la sesión.
 * Prioridad: confirmed > validating > withProducts (productCount>0) > empty.
 */
export function resolveStateName(opts: {
  productCount: number
  validating?: boolean
  confirmed?: boolean
}): SessionStateName {
  if (opts.confirmed) return 'confirmed'
  if (opts.validating) return 'validating'
  if (opts.productCount > 0) return 'withProducts'
  return 'empty'
}
