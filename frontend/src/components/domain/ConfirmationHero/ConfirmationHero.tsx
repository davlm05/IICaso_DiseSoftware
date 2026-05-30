import { Icon } from '@/components/ui'
import styles from './ConfirmationHero.module.css'

export interface ConfirmationHeroProps {
  title?: string
  subtitle?: string
}

/** Hero verde de la confirmación: círculo con check + título y subtítulo. */
export function ConfirmationHero({
  title = 'Puntos acreditados',
  subtitle = 'Tu compra fue verificada en caja',
}: ConfirmationHeroProps) {
  return (
    <div className={styles.hero}>
      <div className={styles.iconWrap}>
        <Icon name="check" className={styles.icon} />
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
