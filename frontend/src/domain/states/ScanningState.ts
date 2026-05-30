import type { SessionStateName } from '@/domain/models/types'
import { BaseSessionState } from './SessionState'

/**
 * Estado transitorio mientras se captura un barcode. Permite escanear.
 * Transición: al resolver el escaneo -> 'withProducts' (o vuelve a 'empty').
 */
export class ScanningState extends BaseSessionState {
  get name(): SessionStateName {
    return 'scanning'
  }

  override readonly canScan = true
}
