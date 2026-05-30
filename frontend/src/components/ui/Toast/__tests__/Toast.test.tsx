import { render, screen } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast', () => {
  it('con visible=false no renderiza nada', () => {
    const { container } = render(<Toast text="Producto agregado" visible={false} />)

    // El componente retorna null: no hay contenido ni rol status.
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Producto agregado')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('por defecto (visible omitido) renderiza el texto con rol status', () => {
    render(<Toast text="Producto agregado" />)

    expect(screen.getByText('Producto agregado')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('con visible muestra el texto y aplica la clase del tono success por defecto', () => {
    render(<Toast text="Listo" />)

    const toast = screen.getByRole('status')
    expect(toast).toHaveTextContent('Listo')
    // La clase del módulo CSS conserva el nombre del tono como subcadena.
    expect(toast.className).toMatch(/success/)
  })

  it('aplica la clase del tono pending cuando tone="pending"', () => {
    render(<Toast text="Pendiente de validar" tone="pending" />)

    const toast = screen.getByRole('status')
    expect(toast.className).toMatch(/pending/)
  })

  it('aplica la clase del tono error cuando tone="error"', () => {
    render(<Toast text="Error al escanear" tone="error" />)

    const toast = screen.getByRole('status')
    expect(toast.className).toMatch(/error/)
  })
})
