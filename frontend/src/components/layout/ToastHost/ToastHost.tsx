import { useToast } from '@/hooks'
import { Toast } from '@/components/ui/Toast'
import styles from './ToastHost.module.css'

/**
 * Host de notificaciones — observa el EventBus vía useToast y muestra el toast
 * actual flotando dentro del marco del teléfono. Se monta dentro de PhoneShell
 * para que aparezca en cualquier pantalla.
 */
export function ToastHost() {
  const { toast } = useToast()
  if (!toast) return null

  return (
    <div className={styles.host}>
      <Toast text={toast.text} tone={toast.tone} icon={toast.icon} visible />
    </div>
  )
}
