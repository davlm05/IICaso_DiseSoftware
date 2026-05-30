import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '@/domain/models/types'
import { PATHS } from '@/router/paths'
import { PhoneShell, TopBar, BottomNav } from '@/components/layout'
import { Button, SectionTitle } from '@/components/ui'
import { LocationBar } from '@/components/domain/LocationBar'
import { PointsCard } from '@/components/domain/PointsCard'
import { ScannedProductsList } from '@/components/domain/ScannedProductsList'
import { SponsoredCarousel } from '@/components/domain/SponsoredCarousel'
import { useShoppingSession, useAuth } from '@/hooks'
import { usePointsStore } from '@/store'
import { ProductService } from '@/services'
import styles from './HomePage.module.css'

/**
 * HomePage — pantalla principal (mockups 1/3/4).
 * Adapta CTAs y secciones según la cantidad de productos escaneados:
 * - 0: estado vacío + carrusel "con puntos hoy".
 * - 1: botón "Escanear otro producto".
 * - >=2: fila "Escanear otro" + "Generar QR de salida".
 */
export default function HomePage() {
  const navigate = useNavigate()

  // Sesión de compra: tienda, productos, puntos pendientes y acciones.
  const { store, products, pendingPoints, removeProduct, generateQr } = useShoppingSession()

  // Saldo y meta del próximo canje.
  const balance = usePointsStore((s) => s.balance)
  const nextRewardThreshold = usePointsStore((s) => s.nextRewardThreshold)

  // Iniciales del avatar.
  const { user } = useAuth()

  // Carrusel patrocinado ("con puntos hoy"): se carga al montar.
  const [sponsored, setSponsored] = useState<Product[]>([])
  useEffect(() => {
    let active = true
    ProductService.getSponsoredToday().then((items) => {
      if (active) setSponsored(items)
    })
    return () => {
      active = false
    }
  }, [])

  // Genera el QR de salida y navega a la pantalla del QR.
  const handleGenerateQr = async () => {
    await generateQr()
    navigate(PATHS.qr)
  }

  const count = products.length

  return (
    <PhoneShell
      background="app"
      header={
        <TopBar
          mode="brand"
          avatarInitials={user?.initials ?? 'JC'}
          onAvatar={() => navigate(PATHS.profile)}
        />
      }
      footer={<BottomNav />}
    >
      <LocationBar store={store} />

      <PointsCard balance={balance} pending={pendingPoints} threshold={nextRewardThreshold} />

      {count === 0 ? (
        <Button variant="primary" fullWidth icon="barcode" onClick={() => navigate(PATHS.scan)}>
          Escanear producto
        </Button>
      ) : null}

      {count === 1 ? (
        <Button variant="primary" fullWidth icon="barcode" onClick={() => navigate(PATHS.scan)}>
          Escanear otro producto
        </Button>
      ) : null}

      {count >= 2 ? (
        <div className={styles.ctaRow}>
          <Button variant="secondary" icon="barcode" onClick={() => navigate(PATHS.scan)}>
            Escanear otro
          </Button>
          <Button variant="primary" icon="qrcode" onClick={handleGenerateQr}>
            Generar QR de salida
          </Button>
        </div>
      ) : null}

      <SectionTitle right={`${count} ${count === 1 ? 'producto' : 'productos'}`}>
        Productos escaneados
      </SectionTitle>

      <ScannedProductsList products={products} onRemove={removeProduct} />

      {count === 0 ? (
        <>
          <SectionTitle>Productos con puntos hoy</SectionTitle>
          <SponsoredCarousel products={sponsored} />
        </>
      ) : null}
    </PhoneShell>
  )
}
