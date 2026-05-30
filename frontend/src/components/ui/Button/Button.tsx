import type { ReactNode } from 'react'
import styles from './Button.module.css'

/** Variantes visuales del botón (derivadas de los mockups). */
export type ButtonVariant = 'primary' | 'secondary' | 'qr' | 'danger' | 'redeem' | 'locked'

export interface ButtonProps {
  variant?: ButtonVariant
  icon?: string // nombre Font Awesome (sin prefijo "fa-")
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  children: ReactNode
}

/** Mapa variante -> clase del módulo CSS. */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  qr: styles.qr,
  danger: styles.danger,
  redeem: styles.redeem,
  locked: styles.locked,
}

/** Botón base de la app: acción primaria/secundaria, QR, peligro, canje y bloqueado. */
export function Button({
  variant = 'primary',
  icon,
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
}: ButtonProps) {
  // La variante "locked" siempre se muestra deshabilitada.
  const isDisabled = disabled || variant === 'locked'
  const classes = [styles.btn, VARIANT_CLASS[variant], fullWidth ? styles.fullWidth : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={isDisabled} onClick={onClick}>
      {icon ? <i className={`fa-solid fa-${icon}`} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  )
}
