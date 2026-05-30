import type { CSSProperties } from 'react'
import type { Reward, RewardGradient } from '@/domain/models/types'
import { Button, Icon, rewardIconName } from '@/components/ui'
import { getRewardLockState } from '@/domain/decorators'
import styles from './RewardCard.module.css'

export interface RewardCardProps {
  reward: Reward
  currentPoints: number
  onRedeem: (reward: Reward) => void
}

/** Mapa gradiente del dominio -> variable CSS de fondo del icono. */
const GRADIENT_VAR: Record<RewardGradient, string> = {
  discount: 'var(--sc-grad-discount)',
  coffee: 'var(--sc-grad-coffee)',
  store: 'var(--sc-grad-store)',
  premium: 'var(--sc-grad-premium)',
}

/** Fila de recompensa: icono, nombre, meta y botón canjear/bloqueado (.reward-row). */
export function RewardCard({ reward, currentPoints, onRedeem }: RewardCardProps) {
  const { locked, missing } = getRewardLockState(reward, currentPoints)

  // Si está bloqueada, el icono usa el gris plano; si no, el gradiente del token.
  const iconStyle: CSSProperties = locked
    ? { background: 'var(--sc-color-border-dashed)' }
    : { background: GRADIENT_VAR[reward.gradient] }

  // Meta: costo en puntos y, si aplica, días de vigencia.
  const meta =
    reward.expiresInDays != null
      ? `${reward.cost} pts · vence en ${reward.expiresInDays} días`
      : `${reward.cost} pts`

  return (
    <div className={styles.row}>
      <div className={styles.iconWrap} style={iconStyle}>
        <Icon name={rewardIconName(reward.iconKey)} className={styles.icon} />
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{reward.name}</span>
        <span className={styles.desc}>{reward.description}</span>
        <span className={styles.meta}>{meta}</span>
      </div>
      {locked ? (
        <Button variant="locked" icon="lock" disabled>
          {`Faltan ${missing}`}
        </Button>
      ) : (
        <Button variant="redeem" onClick={() => onRedeem(reward)}>
          Canjear
        </Button>
      )}
    </div>
  )
}
