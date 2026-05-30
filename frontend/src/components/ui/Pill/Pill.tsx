import type { ReactNode } from 'react'
import styles from './Pill.module.css'

/** Variantes de etiqueta/badge inline. */
export type PillVariant = 'location' | 'pending' | 'points' | 'meta'

export interface PillProps {
  variant: PillVariant
  icon?: string // nombre Font Awesome (sin prefijo "fa-")
  dot?: boolean // muestra un punto verde a la izquierda (location)
  children: ReactNode
}

/** Mapa variante -> clase del módulo CSS. */
const VARIANT_CLASS: Record<PillVariant, string> = {
  location: styles.location,
  pending: styles.pending,
  points: styles.points,
  meta: styles.meta,
}

/** Etiqueta compacta: ubicación, pendientes, puntos o metadato. */
export function Pill({ variant, icon, dot = false, children }: PillProps) {
  const classes = `${styles.pill} ${VARIANT_CLASS[variant]}`

  return (
    <span className={classes}>
      {dot ? <span className={styles.dot} /> : null}
      {icon ? <i className={`fa-solid fa-${icon}`} aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  )
}
