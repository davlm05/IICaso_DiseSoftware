import type { CSSProperties } from 'react'
import type { Reward, RewardGradient } from '@/domain/models/types'
import { Button, Icon, rewardIconName } from '@/components/ui'
import { getRewardLockState } from '@/domain/decorators'
import styles from './FeaturedReward.module.css'

export interface FeaturedRewardProps {
  reward: Reward
  onRedeem: (reward: Reward) => void
  /** Puntos del usuario; si se pasan, el botón refleja el estado bloqueado. */
  currentPoints?: number
}

/** Mapa gradiente del dominio -> variable CSS de fondo. */
const GRADIENT_VAR: Record<RewardGradient, string> = {
  discount: 'var(--sc-grad-discount)',
  coffee: 'var(--sc-grad-coffee)',
  store: 'var(--sc-grad-store)',
  premium: 'var(--sc-grad-premium)',
}

/** Tarjeta destacada con gradiente, icono, nombre, costo y botón Canjear (.featured-coupon). */
export function FeaturedReward({ reward, onRedeem, currentPoints }: FeaturedRewardProps) {
  // El gradiente de la tarjeta se resuelve desde el token según reward.gradient.
  const cardStyle: CSSProperties = { background: GRADIENT_VAR[reward.gradient] }

  // Estado bloqueado opcional (Decorator) cuando se conocen los puntos del usuario.
  const lock = currentPoints === undefined ? null : getRewardLockState(reward, currentPoints)

  return (
    <div className={styles.card} style={cardStyle}>
      <div className={styles.iconWrap}>
        <Icon name={rewardIconName(reward.iconKey)} className={styles.icon} />
      </div>
      <div className={styles.info}>
        <span className={styles.tag}>{lock?.locked ? 'Te falta poco' : 'Disponible ahora'}</span>
        <span className={styles.title}>{reward.name}</span>
        <span className={styles.desc}>{reward.description}</span>
        <span className={styles.cost}>{reward.cost} pts</span>
      </div>
      {lock?.locked ? (
        <Button variant="qr" disabled>
          Faltan {lock.missing}
        </Button>
      ) : (
        <Button variant="qr" onClick={() => onRedeem(reward)}>
          Canjear
        </Button>
      )}
    </div>
  )
}
