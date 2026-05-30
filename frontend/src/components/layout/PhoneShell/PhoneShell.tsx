import type { ReactNode } from 'react'
import { ToastHost } from '@/components/layout/ToastHost'
import styles from './PhoneShell.module.css'

/** Fondos disponibles para el marco del teléfono. */
type PhoneBackground = 'app' | 'primary' | 'dark'

interface PhoneShellProps {
  children: ReactNode
  /** Slot fijo superior (p.ej. TopBar), fuera del área scrollable. */
  header?: ReactNode
  /** Slot fijo inferior (p.ej. BottomNav), fuera del área scrollable. */
  footer?: ReactNode
  /** Fondo del marco. 'primary'/'dark' usan texto claro. */
  background?: PhoneBackground
  /** Fuerza la barra de estado en variante clara (fondos verdes). */
  statusDark?: boolean
  /** Aplica padding por defecto al contenido. Si es false, lo controla el children. */
  contentPadding?: boolean
}

/** Mapea el background a su clase de fondo. */
const BG_CLASS: Record<PhoneBackground, string> = {
  app: styles.bgApp,
  primary: styles.bgPrimary,
  dark: styles.bgDark,
}

/**
 * PhoneShell — marco del teléfono (mockups .phone).
 * Incluye barra de estado, notch y un contenedor de contenido scrollable.
 */
export function PhoneShell({
  children,
  header,
  footer,
  background = 'app',
  statusDark,
  contentPadding = true,
}: PhoneShellProps) {
  // Sobre fondos verdes el contenido va sobre color: la barra de estado se aclara.
  const isGreen = background === 'primary' || background === 'dark'
  const useDarkStatus = statusDark ?? isGreen

  const statusbarClass = useDarkStatus
    ? `${styles.statusbar} ${styles.statusbarDark}`
    : styles.statusbar
  const notchClass = useDarkStatus ? `${styles.notch} ${styles.notchDark}` : styles.notch
  const contentClass = contentPadding
    ? `${styles.content} ${styles.contentPadded} sc-scroll sc-stagger`
    : `${styles.content} sc-scroll`

  return (
    <div className={`${styles.phone} ${BG_CLASS[background]}`}>
      <div className={statusbarClass}>
        <span>9:41</span>
        <div className={notchClass} />
        <span>87%</span>
      </div>
      {header}
      <div className={contentClass}>{children}</div>
      {footer}
      <ToastHost />
    </div>
  )
}
