import type { CSSProperties, ReactNode } from 'react'
import styles from './Card.module.css'

export interface CardProps {
  padding?: string // override de padding (ej. "16px" o "var(--sc-sp-5)")
  className?: string
  children: ReactNode
}

/** Contenedor blanco con borde y radio medio (superficie base de la app). */
export function Card({ padding, className, children }: CardProps) {
  const classes = className ? `${styles.card} ${className}` : styles.card
  // Sólo aplica estilo inline cuando se solicita un padding explícito.
  const style: CSSProperties | undefined = padding ? { padding } : undefined

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  )
}
