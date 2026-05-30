/**
 * Servicio de recompensas (mock).
 *
 * Usa la `RewardFactory` (Factory Method) para transformar las semillas crudas
 * en objetos `Reward` completos. El canje genera un `RedeemedCoupon` local.
 */
import { RewardFactory } from '@/domain/factories'
import type { RedeemedCoupon, Reward } from '@/domain/models/types'
import { REWARD_SEEDS } from '@/services/mock/db'
import { delay } from '@/services/mock/delay'

export const RewardService = {
  /** Catálogo de recompensas disponibles para canjear. */
  async getRewards(): Promise<Reward[]> {
    await delay()
    return RewardFactory.createMany(REWARD_SEEDS)
  },

  /** Canjea una recompensa y devuelve el cupón resultante. */
  async redeem(reward: Reward): Promise<RedeemedCoupon> {
    await delay()
    // Código legible derivado del timestamp actual (sin aleatoriedad).
    const code = `CPN-${Date.now().toString(36).toUpperCase()}`
    return {
      id: code,
      rewardId: reward.id,
      name: reward.name,
      code,
      redeemedAt: Date.now(),
      expiresInDays: reward.expiresInDays,
    }
  },
}
