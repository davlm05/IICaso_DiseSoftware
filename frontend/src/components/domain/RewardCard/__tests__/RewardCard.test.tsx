import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Reward } from '@/domain/models/types'
import { RewardCard } from '../RewardCard'

/** Construye una Reward de prueba; permite sobreescribir campos puntuales. */
function buildReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'r-1',
    type: 'discount',
    name: 'Descuento ₡500',
    description: 'En tu próxima compra',
    cost: 100,
    expiresInDays: null,
    iconKey: 'discount',
    gradient: 'discount',
    premium: false,
    featured: false,
    ...overrides,
  }
}

describe('RewardCard', () => {
  it('muestra nombre y descripción de la recompensa', () => {
    const reward = buildReward()
    render(<RewardCard reward={reward} currentPoints={100} onRedeem={() => {}} />)

    expect(screen.getByText('Descuento ₡500')).toBeInTheDocument()
    expect(screen.getByText('En tu próxima compra')).toBeInTheDocument()
  })

  it('si currentPoints < cost muestra "Faltan N" en un botón deshabilitado', () => {
    // missing = cost - currentPoints = 100 - 30 = 70.
    const reward = buildReward({ cost: 100 })
    render(<RewardCard reward={reward} currentPoints={30} onRedeem={() => {}} />)

    const button = screen.getByRole('button', { name: /Faltan 70/ })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('no muestra "Canjear" mientras la recompensa está bloqueada', () => {
    const reward = buildReward({ cost: 100 })
    render(<RewardCard reward={reward} currentPoints={30} onRedeem={() => {}} />)

    expect(screen.queryByRole('button', { name: 'Canjear' })).not.toBeInTheDocument()
  })

  it('si alcanza muestra "Canjear" habilitado y al pulsarlo llama onRedeem con el reward', async () => {
    const user = userEvent.setup()
    const onRedeem = vi.fn()
    // currentPoints (100) === cost (100): no está bloqueada (locked = cost > points).
    const reward = buildReward({ cost: 100 })
    render(<RewardCard reward={reward} currentPoints={100} onRedeem={onRedeem} />)

    const button = screen.getByRole('button', { name: 'Canjear' })
    expect(button).toBeEnabled()

    await user.click(button)

    expect(onRedeem).toHaveBeenCalledTimes(1)
    expect(onRedeem).toHaveBeenCalledWith(reward)
  })
})
