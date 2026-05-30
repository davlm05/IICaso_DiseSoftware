import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import styles from './TopBar.module.css'

/** Modo de presentación de la barra superior. */
type TopBarMode = 'brand' | 'back'

interface TopBarProps {
  mode: TopBarMode
  /** Título de la variante back. */
  title?: string
  /** Callback del botón de retroceso. */
  onBack?: () => void
  /** Slot derecho opcional (variante back). */
  right?: ReactNode
  /** Iniciales del avatar (variante brand). */
  avatarInitials?: string
  /** Callback al pulsar el avatar (variante brand). */
  onAvatar?: () => void
  /** Adapta los colores a fondos verdes. */
  onPrimary?: boolean
}

/**
 * TopBar — cabecera con dos variantes:
 * - brand: logo SmartCart + avatar con iniciales.
 * - back: flecha de retroceso + título + slot derecho opcional.
 */
export function TopBar({
  mode,
  title,
  onBack,
  right,
  avatarInitials = 'JC',
  onAvatar,
  onPrimary,
}: TopBarProps) {
  const onPrimaryClass = onPrimary ? ` ${styles.onPrimary}` : ''

  if (mode === 'brand') {
    return (
      <header className={`${styles.topbar} ${styles.brand}${onPrimaryClass}`}>
        <div className={styles.logo}>
          Smart<em>Cart</em>
        </div>
        <button type="button" className={styles.avatar} onClick={onAvatar}>
          {avatarInitials}
        </button>
      </header>
    )
  }

  return (
    <header className={`${styles.topbar} ${styles.back}${onPrimaryClass}`}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Volver">
        <Icon name="arrow-left" />
      </button>
      {title ? <h1 className={styles.title}>{title}</h1> : <span className={styles.title} />}
      {right ? <div className={styles.right}>{right}</div> : null}
    </header>
  )
}
