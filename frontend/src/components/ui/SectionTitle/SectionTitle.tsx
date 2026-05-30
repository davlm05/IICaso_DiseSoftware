import type { ReactNode } from 'react'
import styles from './SectionTitle.module.css'

export interface SectionTitleProps {
  children: ReactNode
  right?: ReactNode // contenido opcional alineado a la derecha (ej. enlace o contador)
}

/** Título de sección (.sec-title): 11px, mayúsculas, texto atenuado. */
export function SectionTitle({ children, right }: SectionTitleProps) {
  return (
    <div className={styles.row}>
      <span className={styles.title}>{children}</span>
      {right ? <span className={styles.right}>{right}</span> : null}
    </div>
  )
}
