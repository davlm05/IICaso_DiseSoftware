import type { SessionStateName, SessionStateView } from '@/domain/models/types'

/**
 * State (GoF) — clase base abstracta de los estados de la sesión de compra.
 *
 * Implementa `SessionStateView` con todas las capacidades en `false` por
 * defecto. Cada estado concreto sobreescribe solo las flags que habilita y
 * provee su `name`. Las instancias son inmutables y reutilizables (singleton).
 */
export abstract class BaseSessionState implements SessionStateView {
  /** Nombre discreto del estado; lo define cada subclase. */
  abstract get name(): SessionStateName

  // Capacidades por defecto deshabilitadas; los estados concretos las activan.
  readonly canScan: boolean = false
  readonly canGenerateQr: boolean = false
  readonly canConfirm: boolean = false
}
