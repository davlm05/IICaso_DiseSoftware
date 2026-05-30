import styles from './RewardTabs.module.css'

/** Pestaña activa del panel de recompensas. */
export type RewardTab = 'available' | 'coupons'

export interface RewardTabsProps {
  active: RewardTab
  onChange: (tab: RewardTab) => void
}

/** Configuración de las pestañas (etiqueta visible por clave). */
const TABS: ReadonlyArray<{ key: RewardTab; label: string }> = [
  { key: 'available', label: 'Disponibles' },
  { key: 'coupons', label: 'Mis cupones' },
]

/** Tabs 'Disponibles' / 'Mis cupones'; la activa se muestra en verde (.tabs). */
export function RewardTabs({ active, onChange }: RewardTabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {TABS.map(({ key, label }) => {
        const isActive = key === active
        const classes = isActive ? `${styles.tab} ${styles.active}` : styles.tab
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={classes}
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
