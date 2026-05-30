import type { Command, ScannedProduct, SessionMutations } from '@/domain/models/types'

/**
 * Command (GoF) — Eliminar un producto de la sesión.
 *
 * Recuerda la posición (index) original para poder restaurar el producto en su
 * lugar exacto al deshacer la operación.
 */
export class RemoveProductCommand implements Command {
  readonly label: string
  readonly canUndo = true

  constructor(
    private readonly product: ScannedProduct,
    private readonly index: number,
    private readonly mutations: SessionMutations,
  ) {
    this.label = 'Eliminar ' + product.name
  }

  /** Elimina la línea escaneada de la sesión. */
  execute(): void {
    this.mutations.deleteProduct(this.product.scanId)
  }

  /** Restaura el producto en su posición original. */
  undo(): void {
    this.mutations.restoreProduct(this.product, this.index)
  }
}
