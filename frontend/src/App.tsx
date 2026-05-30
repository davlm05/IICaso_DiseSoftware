import { useEffect } from 'react'
import { AppRoutes } from '@/router/routes'
import { useAuthStore } from '@/store/authStore'
import { useSessionStore } from '@/store/sessionStore'
import { LocationService } from '@/services'

/**
 * App — raíz de la aplicación. Inicializa la sesión (auth demo con JWT mock) y
 * la ubicación (GPS/BLE simulado) una sola vez, y delega el render al router.
 */
export default function App() {
  useEffect(() => {
    // Sesión: inicia la demo si no hay sesión activa; si la hay, valida expiración.
    const auth = useAuthStore.getState()
    if (auth.isAuthenticated) {
      auth.checkSession()
    } else {
      void auth.loginDemo()
    }

    // Ubicación: resuelve la tienda actual si aún no está definida.
    if (!useSessionStore.getState().store) {
      void LocationService.getCurrentStore().then((store) => {
        useSessionStore.getState().setStore(store)
      })
    }
  }, [])

  return <AppRoutes />
}
