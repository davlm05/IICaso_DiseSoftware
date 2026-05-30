import { render, screen } from '@testing-library/react'
import { PointsCard } from '../PointsCard'

describe('PointsCard', () => {
  it('muestra el balance de puntos', () => {
    render(<PointsCard balance={120} pending={0} threshold={200} />)

    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('muestra el texto de faltante calculado por defecto', () => {
    // remaining = max(0, threshold - balance) = 200 - 120 = 80.
    render(<PointsCard balance={120} pending={0} threshold={200} />)

    expect(screen.getByText('Te faltan 80 para tu descuento')).toBeInTheDocument()
    // Etiqueta de la barra de progreso "{balance} / {threshold} pts para canjear".
    expect(screen.getByText('120 / 200 pts para canjear')).toBeInTheDocument()
  })

  it('respeta el subtítulo provisto en lugar del calculado', () => {
    render(
      <PointsCard balance={50} pending={0} threshold={200} subtitle="Sigue acumulando" />,
    )

    expect(screen.getByText('Sigue acumulando')).toBeInTheDocument()
    expect(screen.queryByText(/Te faltan/)).not.toBeInTheDocument()
  })

  it('no muestra la Pill de pendientes cuando pending es 0', () => {
    render(<PointsCard balance={120} pending={0} threshold={200} />)

    expect(screen.queryByText(/Pendientes/)).not.toBeInTheDocument()
  })

  it('muestra la Pill de pendientes solo si pending > 0', () => {
    // formatPoints(15) => "+15", luego "+15 Pendientes".
    render(<PointsCard balance={120} pending={15} threshold={200} />)

    expect(screen.getByText('+15 Pendientes')).toBeInTheDocument()
  })
})
