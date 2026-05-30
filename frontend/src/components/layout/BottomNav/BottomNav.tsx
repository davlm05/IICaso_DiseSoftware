import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { PATHS } from '@/router/paths'
import styles from './BottomNav.module.css'

/** Definición de cada destino de la navegación inferior. */
interface NavItem {
  to: string
  icon: string
  label: string
}

const ITEMS: readonly NavItem[] = [
  { to: PATHS.home, icon: 'house', label: 'Inicio' },
  { to: PATHS.scan, icon: 'barcode', label: 'Escanear' },
  { to: PATHS.rewards, icon: 'gift', label: 'Recompensas' },
  { to: PATHS.profile, icon: 'user', label: 'Perfil' },
]

/**
 * BottomNav — 4 enlaces de navegación con íconos y etiquetas.
 * El enlace activo se resalta en verde mediante la clase active de NavLink.
 */
export function BottomNav() {
  return (
    <nav className={styles.bottomnav}>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === PATHS.home}
          className={({ isActive }) =>
            isActive ? `${styles.item} ${styles.active}` : styles.item
          }
        >
          <Icon name={item.icon} />
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
