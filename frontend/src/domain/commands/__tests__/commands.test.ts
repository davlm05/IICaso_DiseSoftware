import {
  AddProductCommand,
  RemoveProductCommand,
  GenerateQRCommand,
  CommandBus,
} from '@/domain/commands'
import type {
  Command,
  QrTicket,
  ScannedProduct,
  SessionMutations,
} from '@/domain/models/types'

/**
 * Tests del patrón Command (GoF) y su Invoker (CommandBus).
 *
 * Las mutaciones de sesión (SessionMutations) se mockean con objetos cuyos
 * métodos son vi.fn(), de modo que cada comando se prueba aislado del store.
 */

/** Construye un mock de SessionMutations con todos los métodos espiados. */
function createMutationsMock(): SessionMutations {
  return {
    insertProduct: vi.fn(),
    deleteProduct: vi.fn(),
    restoreProduct: vi.fn(),
    setQrTicket: vi.fn(),
    applyValidation: vi.fn(),
  }
}

/** Producto escaneado de ejemplo para los comandos. */
function createScannedProduct(): ScannedProduct {
  return {
    id: 'prod-britt',
    barcode: '7441001823456',
    name: 'Cafe Britt 500g',
    brand: 'Cafe Britt',
    price: 3250,
    iconKey: 'coffee',
    sponsored: true,
    pointsOffered: 15,
    scanId: 'scan-001',
    scannedAt: 1_700_000_000_000,
    isNew: true,
    validated: false,
  }
}

/** Ticket QR de ejemplo para GenerateQRCommand. */
function createQrTicket(): QrTicket {
  return {
    code: 'SC-2026-AX9K-7283',
    sessionId: 'session-001',
    productCount: 1,
    pendingPoints: 15,
    expiresAt: 1_700_000_600_000,
  }
}

describe('AddProductCommand', () => {
  it('execute inserta el producto en la sesión', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const command = new AddProductCommand(product, mutations)

    command.execute()

    expect(mutations.insertProduct).toHaveBeenCalledTimes(1)
    expect(mutations.insertProduct).toHaveBeenCalledWith(product)
  })

  it('undo elimina el producto por su scanId', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const command = new AddProductCommand(product, mutations)

    command.undo()

    expect(mutations.deleteProduct).toHaveBeenCalledTimes(1)
    expect(mutations.deleteProduct).toHaveBeenCalledWith(product.scanId)
  })

  it('expone label descriptivo y admite undo', () => {
    const command = new AddProductCommand(createScannedProduct(), createMutationsMock())

    expect(command.label).toBe('Agregar Cafe Britt 500g')
    expect(command.canUndo).toBe(true)
  })
})

describe('RemoveProductCommand', () => {
  it('execute elimina el producto por su scanId', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const command = new RemoveProductCommand(product, 2, mutations)

    command.execute()

    expect(mutations.deleteProduct).toHaveBeenCalledTimes(1)
    expect(mutations.deleteProduct).toHaveBeenCalledWith(product.scanId)
  })

  it('undo restaura el producto en su índice original', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const index = 3
    const command = new RemoveProductCommand(product, index, mutations)

    command.undo()

    expect(mutations.restoreProduct).toHaveBeenCalledTimes(1)
    expect(mutations.restoreProduct).toHaveBeenCalledWith(product, index)
  })

  it('expone label descriptivo y admite undo', () => {
    const command = new RemoveProductCommand(createScannedProduct(), 0, createMutationsMock())

    expect(command.label).toBe('Eliminar Cafe Britt 500g')
    expect(command.canUndo).toBe(true)
  })
})

describe('GenerateQRCommand', () => {
  it('execute fija el ticket QR en la sesión', () => {
    const mutations = createMutationsMock()
    const ticket = createQrTicket()
    const command = new GenerateQRCommand(ticket, mutations)

    command.execute()

    expect(mutations.setQrTicket).toHaveBeenCalledTimes(1)
    expect(mutations.setQrTicket).toHaveBeenCalledWith(ticket)
  })

  it('undo retira el ticket (setQrTicket null)', () => {
    const mutations = createMutationsMock()
    const command = new GenerateQRCommand(createQrTicket(), mutations)

    command.undo()

    expect(mutations.setQrTicket).toHaveBeenCalledTimes(1)
    expect(mutations.setQrTicket).toHaveBeenCalledWith(null)
  })

  it('expone label fijo y admite undo', () => {
    const command = new GenerateQRCommand(createQrTicket(), createMutationsMock())

    expect(command.label).toBe('Generar QR')
    expect(command.canUndo).toBe(true)
  })
})

describe('CommandBus', () => {
  let bus: CommandBus

  beforeEach(() => {
    bus = new CommandBus()
  })

  it('dispatch ejecuta el comando y lo apila si canUndo es true', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const command = new AddProductCommand(product, mutations)

    bus.dispatch(command)

    expect(mutations.insertProduct).toHaveBeenCalledTimes(1)
    expect(bus.canUndo()).toBe(true)
    expect(bus.history).toHaveLength(1)
    expect(bus.history[0]).toBe(command)
  })

  it('dispatch ejecuta pero NO apila un comando con canUndo false', () => {
    const execute = vi.fn()
    const nonUndoable: Command = {
      label: 'No deshacible',
      canUndo: false,
      execute,
      undo: vi.fn(),
    }

    bus.dispatch(nonUndoable)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(bus.canUndo()).toBe(false)
    expect(bus.history).toHaveLength(0)
  })

  it('undo deshace el último comando (LIFO) y retorna true', () => {
    const mutations = createMutationsMock()
    const product = createScannedProduct()
    const add = new AddProductCommand(product, mutations)
    const remove = new RemoveProductCommand(product, 1, mutations)

    bus.dispatch(add)
    bus.dispatch(remove)

    // El último despachado fue remove; su undo restaura el producto.
    const result = bus.undo()

    expect(result).toBe(true)
    expect(mutations.restoreProduct).toHaveBeenCalledTimes(1)
    expect(mutations.restoreProduct).toHaveBeenCalledWith(product, 1)
    expect(bus.history).toHaveLength(1)
    expect(bus.history[0]).toBe(add)
  })

  it('undo retorna false cuando el historial está vacío', () => {
    expect(bus.canUndo()).toBe(false)
    expect(bus.undo()).toBe(false)
  })

  it('clear vacía el historial de comandos', () => {
    const mutations = createMutationsMock()
    bus.dispatch(new AddProductCommand(createScannedProduct(), mutations))
    expect(bus.canUndo()).toBe(true)

    bus.clear()

    expect(bus.canUndo()).toBe(false)
    expect(bus.history).toHaveLength(0)
  })
})
