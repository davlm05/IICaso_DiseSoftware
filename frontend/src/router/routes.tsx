import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PhoneShell } from '@/components/layout'
import { PATHS } from './paths'

/**
 * Rutas de la app con carga perezosa (code splitting): cada pantalla es un
 * chunk independiente que se descarga al navegar a su ruta.
 */
const HomePage = lazy(() => import('@/pages/HomePage/HomePage'))
const ScanPage = lazy(() => import('@/pages/ScanPage/ScanPage'))
const ManualEntryPanel = lazy(() => import('@/pages/ScanPage/ManualEntryPanel'))
const QrValidationPage = lazy(() => import('@/pages/QrValidationPage/QrValidationPage'))
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage/ConfirmationPage'))
const RewardsPage = lazy(() => import('@/pages/RewardsPage/RewardsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage/ProfilePage'))

/** Fallback mientras carga el chunk de una ruta. */
function RouteFallback() {
  return (
    <PhoneShell>
      <div style={{ margin: 'auto', color: 'var(--sc-color-text-muted)' }}>Cargando…</div>
    </PhoneShell>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={PATHS.home} element={<HomePage />} />
        <Route path={PATHS.scan} element={<ScanPage />} />
        <Route path={PATHS.scanManual} element={<ManualEntryPanel />} />
        <Route path={PATHS.qr} element={<QrValidationPage />} />
        <Route path={PATHS.confirmation} element={<ConfirmationPage />} />
        <Route path={PATHS.rewards} element={<RewardsPage />} />
        <Route path={PATHS.profile} element={<ProfilePage />} />
        <Route path="*" element={<Navigate to={PATHS.home} replace />} />
      </Routes>
    </Suspense>
  )
}
