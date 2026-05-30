import { PhoneShell, TopBar, BottomNav } from '@/components/layout'
import { Button, Card, Icon } from '@/components/ui'
import { useAuth } from '@/hooks'
import styles from './ProfilePage.module.css'

/**
 * ProfilePage — pestaña "Perfil" del BottomNav.
 *
 * Placeholder con avatar de iniciales, nombre/correo del usuario, una tarjeta
 * con datos básicos de membresía y la acción de cerrar sesión.
 */
export default function ProfilePage() {
  const { user, logout } = useAuth()

  const initials = user?.initials ?? 'JC'

  return (
    <PhoneShell
      background="app"
      header={<TopBar mode="brand" avatarInitials={initials} />}
      footer={<BottomNav />}
    >
      <div className={styles.profile}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>
          <h1 className={styles.name}>{user?.name ?? 'Invitado'}</h1>
          {user?.email ? <p className={styles.email}>{user.email}</p> : null}
        </div>

        <Card className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>
              <Icon name="id-card" />
            </span>
            <div className={styles.infoText}>
              <span className={styles.infoLabel}>Membresía</span>
              <span className={styles.infoValue}>Miembro SmartCart</span>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>
              <Icon name="envelope" />
            </span>
            <div className={styles.infoText}>
              <span className={styles.infoLabel}>Correo</span>
              <span className={styles.infoValue}>{user?.email ?? '—'}</span>
            </div>
          </div>
        </Card>

        <Button variant="secondary" fullWidth icon="right-from-bracket" onClick={logout}>
          Cerrar sesión
        </Button>

        <p className={styles.note}>Sección en construcción</p>
      </div>
    </PhoneShell>
  )
}
