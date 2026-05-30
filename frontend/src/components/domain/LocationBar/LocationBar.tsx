import type { Store } from '@/domain/models/types'
import { Icon } from '@/components/ui'
import styles from './LocationBar.module.css'

/** Props de la barra de ubicación (.loc-row). */
export interface LocationBarProps {
  store: Store | null
}

/**
 * Barra de ubicación: punto verde + tienda actual + ícono location-dot.
 * Si no hay tienda, muestra estado "Detectando ubicación...".
 */
export function LocationBar({ store }: LocationBarProps) {
  // Sin tienda: estado de detección, sin punto ni ícono de ubicación.
  if (store === null) {
    return (
      <div className={styles.row}>
        <div className={styles.dot} />
        <div className={styles.text}>Detectando ubicación...</div>
      </div>
    )
  }

  return (
    <div className={styles.row}>
      <div className={styles.dot} />
      <div className={styles.text}>
        Estás en <strong>{store.name}</strong>
      </div>
      <Icon name="location-dot" className={styles.icon} />
    </div>
  )
}
