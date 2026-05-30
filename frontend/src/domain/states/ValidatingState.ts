import type { SessionStateName } from '@/domain/models/types'
import { BaseSessionState } from './SessionState'

/**
 * QR generado y a la espera de validación en el POS. Solo se puede confirmar.
 * Transición: al confirmar la validación -> 'confirmed'.
 */
export class ValidatingState extends BaseSessionState {
  get name(): SessionStateName {
    return 'validating'
  }

  override readonly canConfirm = true
}
