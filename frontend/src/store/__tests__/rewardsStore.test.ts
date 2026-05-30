/**
 * Tests unitarios de rewardsStore.
 *
 * Cubre la carga del catálogo (loadRewards) y el canje (redeem): con saldo
 * suficiente debita puntos en pointsStore y agrega un cupón a coupons; con saldo
 * insuficiente NO hace nada.
 *
 * Se mockea '@/services' para que RewardService sea determinístico y rápido
 * (sin el delay del mock). El resto de exports reales del barrel se conservan
 * porque rewardsStore solo consume RewardService de ese módulo.
 */
import type { RedeemedCoupon, Reward } from '@/domain/models/types'

// --- Recompensas y cupón deterministas para el mock del servicio -------------
const RECOMPENSAS: Reward[] = [
  {
    id: 'rw-test-barata',
    type: 'category',
    name: '-10% en lacteos',
    description: 'Descuento en toda una categoria',
    cost: 50,
    expiresInDays: 15,
    iconKey: 'category',
    gradient: 'discount',
    premium: false,
    featured: false,
  },
  {
    id: 'rw-test-cara',
    type: 'premium',
    name: 'Compra gratis',
    description: 'Recompensa premium exclusiva',
    cost: 500,
    expiresInDays: null,
    iconKey: 'premium',
    gradient: 'premium',
    premium: true,
    featured: false,
  },
]

const CUPON: RedeemedCoupon = {
  id: 'CPN-TEST-001',
  rewardId: 'rw-test-barata',
  name: '-10% en lacteos',
  code: 'CPN-TEST-001',
  redeemedAt: 1_700_000_000_000,
  expiresInDays: 15,
}

// Mockea el barrel de servicios: RewardService determinístico, sin delay.
vi.mock('@/services', () => ({
  RewardService: {
    getRewards: vi.fn(async () => RECOMPENSAS),
    redeem: vi.fn(async () => CUPON),
  },
}))

// Imports DESPUÉS del vi.mock para que los stores usen el servicio mockeado.
import { useRewardsStore } from '@/store/rewardsStore'
import { usePointsStore } from '@/store/pointsStore'
import { RewardService } from '@/services'

const recompensaBarata = RECOMPENSAS[0] // cost 50
const recompensaCara = RECOMPENSAS[1] // cost 500

describe('rewardsStore', () => {
  // Resetea ambos singletons antes de cada test.
  beforeEach(() => {
    usePointsStore.getState().reset()
    useRewardsStore.setState({ rewards: [], coupons: [], loading: false })
    vi.clearAllMocks()
  })

  describe('loadRewards', () => {
    it('puebla rewards con el catálogo del servicio', async () => {
      await useRewardsStore.getState().loadRewards()

      const state = useRewardsStore.getState()
      expect(RewardService.getRewards).toHaveBeenCalledTimes(1)
      expect(state.rewards).toEqual(RECOMPENSAS)
      expect(state.loading).toBe(false)
    })
  })

  describe('redeem', () => {
    it('con saldo suficiente debita puntos y agrega un cupón', async () => {
      // INITIAL_POINTS.balance es 120 >= 50.
      const saldoInicial = usePointsStore.getState().balance
      expect(saldoInicial).toBeGreaterThanOrEqual(recompensaBarata.cost)

      await useRewardsStore.getState().redeem(recompensaBarata)

      // Puntos debitados en pointsStore.
      expect(usePointsStore.getState().balance).toBe(saldoInicial - recompensaBarata.cost)
      // Cupón agregado a coupons.
      const { coupons } = useRewardsStore.getState()
      expect(coupons).toHaveLength(1)
      expect(coupons[0]).toEqual(CUPON)
      expect(RewardService.redeem).toHaveBeenCalledTimes(1)
    })

    it('con saldo insuficiente NO hace nada', async () => {
      // INITIAL_POINTS.balance (120) < 500: no debe canjear.
      const saldoInicial = usePointsStore.getState().balance
      expect(saldoInicial).toBeLessThan(recompensaCara.cost)

      await useRewardsStore.getState().redeem(recompensaCara)

      // Saldo intacto, sin cupones y sin llamar al servicio de canje.
      expect(usePointsStore.getState().balance).toBe(saldoInicial)
      expect(useRewardsStore.getState().coupons).toHaveLength(0)
      expect(RewardService.redeem).not.toHaveBeenCalled()
    })
  })
})
