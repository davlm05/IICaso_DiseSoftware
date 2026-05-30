import { RewardFactory } from '@/domain/factories'
import type { Reward, RewardSeed, RewardType } from '@/domain/models/types'
import { REWARD_SEEDS } from '@/services/mock/db'

/**
 * Tests del patrón Factory Method (GoF) para recompensas.
 *
 * Verifica que RewardFactory.create deriva gradient/iconKey/premium/description
 * según el `type` de la semilla, y que createMany mapea todas las seeds.
 */

/** Atributos derivados esperados por tipo de recompensa. */
const EXPECTED_TRAITS: Record<
  RewardType,
  { gradient: Reward['gradient']; iconKey: Reward['iconKey']; premium: boolean; description: string }
> = {
  discount: {
    gradient: 'discount',
    iconKey: 'discount',
    premium: false,
    description: 'Descuento directo en tu próxima compra',
  },
  twoForOne: {
    gradient: 'coffee',
    iconKey: 'twoForOne',
    premium: false,
    description: 'Lleva 2 y paga 1',
  },
  category: {
    gradient: 'discount',
    iconKey: 'category',
    premium: false,
    description: 'Descuento en toda una categoría',
  },
  voucher: {
    gradient: 'store',
    iconKey: 'voucher',
    premium: false,
    description: 'Bono canjeable en tienda',
  },
  premium: {
    gradient: 'premium',
    iconKey: 'premium',
    premium: true,
    description: 'Recompensa premium exclusiva',
  },
}

describe('RewardFactory.create', () => {
  const types: RewardType[] = ['discount', 'twoForOne', 'category', 'voucher', 'premium']

  it.each(types)('deriva gradient/iconKey/premium/description para el tipo %s', (type) => {
    const seed: RewardSeed = { id: `seed-${type}`, type, name: `Nombre ${type}`, cost: 100 }

    const reward = RewardFactory.create(seed)

    const expected = EXPECTED_TRAITS[type]
    expect(reward.gradient).toBe(expected.gradient)
    expect(reward.iconKey).toBe(expected.iconKey)
    expect(reward.premium).toBe(expected.premium)
    expect(reward.description).toBe(expected.description)
  })

  it('conserva los campos de la semilla (id, type, name, cost)', () => {
    const seed: RewardSeed = { id: 'rw-x', type: 'discount', name: '-15%', cost: 100 }

    const reward = RewardFactory.create(seed)

    expect(reward.id).toBe('rw-x')
    expect(reward.type).toBe('discount')
    expect(reward.name).toBe('-15%')
    expect(reward.cost).toBe(100)
  })

  it('aplica featured=false y expiresInDays=null por defecto cuando se omiten', () => {
    const seed: RewardSeed = { id: 'rw-default', type: 'discount', name: 'Default', cost: 50 }

    const reward = RewardFactory.create(seed)

    expect(reward.featured).toBe(false)
    expect(reward.expiresInDays).toBeNull()
  })

  it('respeta featured y expiresInDays cuando vienen en la semilla', () => {
    const seed: RewardSeed = {
      id: 'rw-2x1',
      type: 'twoForOne',
      name: '2x1',
      cost: 75,
      expiresInDays: 30,
      featured: true,
    }

    const reward = RewardFactory.create(seed)

    expect(reward.featured).toBe(true)
    expect(reward.expiresInDays).toBe(30)
  })
})

describe('RewardFactory.createMany', () => {
  it('mapea todas las seeds del catálogo a Reward', () => {
    const rewards = RewardFactory.createMany(REWARD_SEEDS)

    expect(rewards).toHaveLength(REWARD_SEEDS.length)
    rewards.forEach((reward, i) => {
      expect(reward.id).toBe(REWARD_SEEDS[i].id)
      expect(reward.type).toBe(REWARD_SEEDS[i].type)
    })
  })

  it('cada Reward generada coincide con create() individual', () => {
    const rewards = RewardFactory.createMany(REWARD_SEEDS)

    rewards.forEach((reward, i) => {
      expect(reward).toEqual(RewardFactory.create(REWARD_SEEDS[i]))
    })
  })

  it('retorna lista vacía para un arreglo de seeds vacío', () => {
    expect(RewardFactory.createMany([])).toEqual([])
  })
})
