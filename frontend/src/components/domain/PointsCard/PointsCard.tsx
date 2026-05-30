import { ProgressBar, Pill } from '@/components/ui'
import { formatPoints } from '@/utils/format'
import styles from './PointsCard.module.css'

/** Props de la tarjeta de puntos (.pts-card). */
export interface PointsCardProps {
  balance: number // puntos acreditados
  pending: number // puntos pendientes de validar esta sesión
  threshold: number // meta para el próximo canje
  subtitle?: string // subtítulo opcional (default calculado)
}

/**
 * Tarjeta verde de puntos: balance grande, subtítulo y barra de progreso.
 * Si hay puntos pendientes muestra una Pill clara arriba a la derecha.
 */
export function PointsCard({ balance, pending, threshold, subtitle }: PointsCardProps) {
  // Subtítulo por defecto: cuánto falta para el descuento.
  const remaining = Math.max(0, threshold - balance)
  const sub = subtitle ?? `Te faltan ${remaining} para tu descuento`

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div>
          <div className={styles.label}>TUS PUNTOS</div>
          <div className={styles.number}>{balance}</div>
          <div className={styles.sub}>{sub}</div>
        </div>
        {pending > 0 ? (
          <div className={styles.pending}>
            <Pill variant="points">{`${formatPoints(pending)} Pendientes`}</Pill>
          </div>
        ) : null}
      </div>
      <div className={styles.barWrap}>
        <ProgressBar tone="onPrimary" value={balance} max={threshold} />
        <div className={styles.barLabel}>{`${balance} / ${threshold} pts para canjear`}</div>
      </div>
    </div>
  )
}
