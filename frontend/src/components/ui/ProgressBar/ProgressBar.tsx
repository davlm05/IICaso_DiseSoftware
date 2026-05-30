import styles from './ProgressBar.module.css'

/** Props de la barra de progreso de puntos. */
export interface ProgressBarProps {
  value: number
  max: number
  /** onPrimary: sobre tarjeta verde (blanco). default: sobre fondo claro (verde). */
  tone?: 'onPrimary' | 'default'
}

/** Limita un número al rango [min, max]. */
function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

/** Barra de progreso accesible; ancho = clamp((value/max)*100, 0, 100). */
export function ProgressBar({ value, max, tone = 'default' }: ProgressBarProps) {
  const ratio = max > 0 ? (value / max) * 100 : 0
  const pct = clamp(ratio, 0, 100)
  const trackClass = tone === 'onPrimary' ? styles.trackOnPrimary : styles.trackDefault

  return (
    <div
      className={`${styles.track} ${trackClass}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  )
}
