import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ScannedProduct } from '@/domain/models/types'
import { ProductListItem } from '../ProductListItem'

/**
 * Construye un ScannedProduct de prueba; permite sobreescribir campos puntuales.
 */
function buildScannedProduct(overrides: Partial<ScannedProduct> = {}): ScannedProduct {
  return {
    id: 'p-1',
    barcode: '7441234567890',
    name: 'Café Premium',
    brand: 'Café Rey',
    price: 3250,
    iconKey: 'coffee',
    sponsored: true,
    pointsOffered: 15,
    scanId: 'scan-abc',
    scannedAt: 1_700_000_000_000,
    isNew: false,
    validated: false,
    ...overrides,
  }
}

describe('ProductListItem', () => {
  it('renderiza nombre, marca, precio formateado y el tag de puntos', () => {
    const product = buildScannedProduct()
    render(<ProductListItem product={product} index={0} onRemove={() => {}} />)

    // Nombre del producto.
    expect(screen.getByText('Café Premium')).toBeInTheDocument()
    // Marca + precio en una misma línea de metadatos ("Café Rey · 3,250").
    expect(screen.getByText(/Café Rey/)).toBeInTheDocument()
    expect(screen.getByText(/3,250/)).toBeInTheDocument()
    // Tag de puntos formateado con signo ("+15 pts").
    expect(screen.getByText('+15 pts')).toBeInTheDocument()
  })

  it('no muestra "Nuevo" cuando isNew es false', () => {
    const product = buildScannedProduct({ isNew: false })
    render(<ProductListItem product={product} index={0} onRemove={() => {}} />)

    expect(screen.queryByText('Nuevo')).not.toBeInTheDocument()
  })

  it('muestra "Nuevo" cuando isNew es true', () => {
    const product = buildScannedProduct({ isNew: true })
    render(<ProductListItem product={product} index={0} onRemove={() => {}} />)

    expect(screen.getByText('Nuevo')).toBeInTheDocument()
  })

  it('al pulsar eliminar llama onRemove con el scanId', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const product = buildScannedProduct({ scanId: 'scan-xyz' })
    render(<ProductListItem product={product} index={2} onRemove={onRemove} />)

    // El botón se identifica por su aria-label "Eliminar {nombre}".
    const removeButton = screen.getByRole('button', { name: 'Eliminar Café Premium' })
    await user.click(removeButton)

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith('scan-xyz')
  })
})
