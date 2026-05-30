import type { Command, Reward } from '@/domain/models/types'

/** Callbacks inyectados para canjear una recompensa y revertir el canje. */
interface RedeemCouponDeps {
  onRedeem: () => void
  onUndo: () => void
}

/**
 * Command (GoF) — Canjear una recompensa por un cupón.
 *
 * No depende de SessionMutations: recibe los callbacks de canje/reversión
 * (onRedeem / onUndo) para mantenerse desacoplado del store de recompensas.
 */
export class RedeemCouponCommand implements Command {
  readonly label: string
  readonly canUndo = true

  constructor(
    private readonly reward: Reward,
    private readonly deps: RedeemCouponDeps,
  ) {
    this.label = 'Canjear ' + reward.name
  }

  /** Ejecuta el canje de la recompensa. */
  execute(): void {
    this.deps.onRedeem()
  }

  /** Revierte el canje de la recompensa. */
  undo(): void {
    this.deps.onUndo()
  }
}
