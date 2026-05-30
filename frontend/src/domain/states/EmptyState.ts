import type { SessionStateName } from '@/domain/models/types'
import { BaseSessionState } from './SessionState'

/**
 * Estado inicial: carrito vacío. Solo se puede escanear para añadir productos.
 * Transición: al escanear el primer producto -> 'withProducts'.
 */
export class EmptyState extends BaseSessionState {
  get name(): SessionStateName {
    return 'empty'
  }

  override readonly canScan = true
}
