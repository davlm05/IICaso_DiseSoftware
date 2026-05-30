import { Icon } from '@/components/ui'
import styles from './BalanceCard.module.css'

export interface BalanceCardProps {
  points: number
}

/** Tarjeta verde de balance: puntos disponibles + icono estrella (.balance-card). */
export function BalanceCard({ points }: BalanceCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <span className={styles.label}>Tus puntos disponibles</span>
        <span className={styles.num}>{points}</span>
        <span className={styles.sub}>Listos para canjear</span>
      </div>
      <Icon name="star" className={styles.icon} />
    </div>
  )
}
