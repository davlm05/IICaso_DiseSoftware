/**
 * rewardsStore — catálogo de recompensas y cupones canjeados.
 *
 * Carga el catálogo (Factory Method vía RewardService) y orquesta el canje
 * mediante el patrón Command (RedeemCouponCommand): el canje descuenta puntos
 * y agrega el cupón; su undo revierte ambos efectos. Publica COUPON_REDEEMED.
 */
import { create } from 'zustand'
import type { RedeemedCoupon, Reward } from '@/domain/models/types'
import { RewardService } from '@/services'
import { RedeemCouponCommand, commandBus } from '@/domain/commands'
import { eventBus } from '@/domain/events/EventBus'
import { usePointsStore } from './pointsStore'

interface RewardsStore {
  rewards: Reward[]
  coupons: RedeemedCoupon[]
  loading: boolean
  loadRewards(): Promise<void>
  redeem(reward: Reward): Promise<void>
}

export const useRewardsStore = create<RewardsStore>()((set) => ({
  rewards: [],
  coupons: [],
  loading: false,

  // Carga el catálogo de recompensas disponibles.
  loadRewards: async () => {
    set({ loading: true })
    const rewards = await RewardService.getRewards()
    set({ rewards, loading: false })
  },

  // Canjea una recompensa si hay saldo suficiente (Command con undo).
  redeem: async (reward) => {
    // Sin puntos suficientes: no se canjea.
    if (usePointsStore.getState().balance < reward.cost) return

    const coupon = await RewardService.redeem(reward)

    const command = new RedeemCouponCommand(reward, {
      // Aplica el canje: descuenta puntos y agrega el cupón.
      onRedeem: () => {
        usePointsStore.getState().debit(reward.cost)
        set((s) => ({ coupons: [...s.coupons, coupon] }))
      },
      // Revierte el canje: reintegra puntos y quita el cupón.
      onUndo: () => {
        usePointsStore.getState().credit(reward.cost)
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== coupon.id) }))
      },
    })
    commandBus.dispatch(command)

    eventBus.publish<{ reward: Reward; coupon: RedeemedCoupon }>({
      type: 'COUPON_REDEEMED',
      payload: { reward, coupon },
      message: reward.name + ' canjeado · -' + reward.cost + ' pts',
    })
  },
}))
