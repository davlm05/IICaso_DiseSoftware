import { useEffect, useState } from 'react'
import { PhoneShell, TopBar, BottomNav } from '@/components/layout'
import { SectionTitle } from '@/components/ui'
import { BalanceCard } from '@/components/domain/BalanceCard'
import { RewardTabs } from '@/components/domain/RewardTabs'
import type { RewardTab } from '@/components/domain/RewardTabs'
import { FeaturedReward } from '@/components/domain/FeaturedReward'
import { RewardCard } from '@/components/domain/RewardCard'
import { useRewardsStore, usePointsStore } from '@/store'
import { useAuth } from '@/hooks'
import type { RedeemedCoupon } from '@/domain/models/types'
import styles from './RewardsPage.module.css'

/** Fila de cupón canjeado (pestaña "Mis cupones"). */
function CouponRow({ coupon }: { coupon: RedeemedCoupon }) {
  return (
    <div className={styles.couponRow}>
      <div className={styles.couponInfo}>
        <span className={styles.couponName}>{coupon.name}</span>
        <span className={styles.couponCode}>{coupon.code}</span>
      </div>
      {coupon.expiresInDays != null ? (
        <span className={styles.couponExpiry}>{`Vence en ${coupon.expiresInDays} días`}</span>
      ) : null}
    </div>
  )
}

/**
 * RewardsPage — pantalla 7 "Mis recompensas".
 * Muestra el saldo de puntos, tabs (Disponibles / Mis cupones), la recompensa
 * destacada y el listado de recompensas o cupones canjeados.
 */
export default function RewardsPage() {
  const rewards = useRewardsStore((s) => s.rewards)
  const coupons = useRewardsStore((s) => s.coupons)
  const loadRewards = useRewardsStore((s) => s.loadRewards)
  const redeem = useRewardsStore((s) => s.redeem)
  const balance = usePointsStore((s) => s.balance)
  const { user } = useAuth()

  const [tab, setTab] = useState<RewardTab>('available')

  // Al montar: carga el catálogo de recompensas si aún no está cargado.
  useEffect(() => {
    if (rewards.length === 0) loadRewards()
  }, [rewards.length, loadRewards])

  // Recompensa destacada (gradiente, recomendada para el usuario).
  const featured = rewards.find((r) => r.featured)

  return (
    <PhoneShell
      background="app"
      header={<TopBar mode="brand" avatarInitials={user?.initials ?? 'JC'} />}
      footer={<BottomNav />}
    >
      <BalanceCard points={balance} />
      <RewardTabs active={tab} onChange={setTab} />

      {tab === 'available' ? (
        <>
          {featured ? (
            <>
              <SectionTitle>Recomendado para ti</SectionTitle>
              <FeaturedReward reward={featured} onRedeem={redeem} currentPoints={balance} />
            </>
          ) : null}
          <SectionTitle>Más recompensas</SectionTitle>
          <div className={styles.rewardCard}>
            {rewards
              .filter((r) => !r.featured)
              .map((r) => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  currentPoints={balance}
                  onRedeem={redeem}
                />
              ))}
          </div>
        </>
      ) : (
        <>
          {coupons.length === 0 ? (
            <div className={styles.empty}>Aún no has canjeado cupones</div>
          ) : (
            <div className={styles.couponList}>
              {coupons.map((c) => (
                <CouponRow key={c.id} coupon={c} />
              ))}
            </div>
          )}
        </>
      )}
    </PhoneShell>
  )
}
