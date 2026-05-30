import type { SessionStateName } from '@/domain/models/types'
import { BaseSessionState } from './SessionState'

/**
 * Compra validada y puntos acreditados. Se permite escanear para iniciar una
 * nueva compra.
 * Transición: al escanear de nuevo -> 'withProducts' (nueva sesión).
 */
export class ConfirmedState extends BaseSessionState {
  get name(): SessionStateName {
    return 'confirmed'
  }

  override readonly canScan = true
}
