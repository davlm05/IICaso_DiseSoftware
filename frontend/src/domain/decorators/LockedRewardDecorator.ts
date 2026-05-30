import type { Reward } from '@/domain/models/types'

/**
 * Decorator (GoF) para el estado de bloqueo de una recompensa.
 *
 * Envuelve la recompensa junto con los puntos actuales del usuario y deriva si
 * está bloqueada (cuesta más de lo que se tiene) y cuántos puntos faltan.
 */
export class LockedRewardDecorator {
  private readonly reward: Reward
  private readonly currentPoints: number

  constructor(input: { reward: Reward; currentPoints: number }) {
    this.reward = input.reward
    this.currentPoints = input.currentPoints
  }

  /** true si la recompensa cuesta más puntos de los disponibles. */
  isLocked(): boolean {
    return this.reward.cost > this.currentPoints
  }

  /** Puntos que faltan para poder canjear (0 si ya alcanza). */
  missingPoints(): number {
    return Math.max(0, this.reward.cost - this.currentPoints)
  }
}
