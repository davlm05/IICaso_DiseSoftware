import type { SessionStateName } from '@/domain/models/types'
import { BaseSessionState } from './SessionState'

/**
 * Hay productos pendientes en el carrito. Se puede seguir escaneando y ya es
 * posible generar el QR para validar en caja.
 * Transición: al generar el QR -> 'validating'; si se vacía -> 'empty'.
 */
export class WithProductsState extends BaseSessionState {
  get name(): SessionStateName {
    return 'withProducts'
  }

  override readonly canScan = true
  override readonly canGenerateQr = true
}
