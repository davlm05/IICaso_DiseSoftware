import { Card, Icon, ProgressBar } from '@/components/ui'
import { formatPoints, clampPercent } from '@/utils/format'
import styles from './ConfirmationResultCard.module.css'

export interface ConfirmationResultCardProps {
  creditedPoints: number
  totalBalance: number
  threshold: number
}

/** Tarjeta de resultado: puntos ganados hoy, total, progreso a meta y faltante. */
export function ConfirmationResultCard({
  creditedPoints,
  totalBalance,
  threshold,
}: ConfirmationResultCardProps) {
  // Faltante acotado a 0 cuando ya se alcanzó la meta.
  const remaining = Math.max(0, threshold - totalBalance)
  // clampPercent mantiene el progreso dentro de [0, 100] (consistencia con la barra).
  const reached = clampPercent(totalBalance, threshold) >= 100

  return (
    <Card className={styles.card} padding="18px 16px">
      <span className={styles.big}>{formatPoints(creditedPoints)}</span>
      <div className={styles.info}>
        <p className={styles.label}>Puntos ganados hoy</p>
        <p className={styles.total}>Total: {totalBalance} pts</p>
        <ProgressBar value={totalBalance} max={threshold} />
        <p className={styles.next}>
          {reached
            ? 'Ya alcanzaste tu descuento'
            : `Te faltan ${remaining} pts para tu descuento`}
        </p>
      </div>
      <Icon name="star" className={styles.star} />
    </Card>
  )
}
