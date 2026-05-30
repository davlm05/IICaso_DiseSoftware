/**
 * Patrón Factory Method para recompensas.
 *
 * Transforma las `RewardSeed` crudas del catálogo (db.ts -> REWARD_SEEDS) en
 * objetos `Reward` completos, derivando gradiente, ícono, flag premium y
 * descripción a partir del `type`. Centraliza estas reglas en un solo lugar.
 */
import type { IconKey, Reward, RewardGradient, RewardSeed, RewardType } from '@/domain/models/types'

/** Atributos derivados del tipo de recompensa. */
interface RewardTraits {
  gradient: RewardGradient
  iconKey: IconKey
  premium: boolean
  description: string
}

/** Mapa tipo -> atributos derivados (núcleo del Factory Method). */
const TRAITS_BY_TYPE: Record<RewardType, RewardTraits> = {
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

export const RewardFactory = {
  /** Crea una `Reward` a partir de una semilla, derivando atributos por tipo. */
  create(seed: RewardSeed): Reward {
    const traits = TRAITS_BY_TYPE[seed.type]
    return {
      id: seed.id,
      type: seed.type,
      name: seed.name,
      cost: seed.cost,
      description: traits.description,
      gradient: traits.gradient,
      iconKey: traits.iconKey,
      premium: traits.premium,
      featured: seed.featured ?? false,
      expiresInDays: seed.expiresInDays ?? null,
    }
  },

  /** Crea varias `Reward` a partir de una lista de semillas. */
  createMany(seeds: RewardSeed[]): Reward[] {
    return seeds.map((seed) => this.create(seed))
  },
}
