import type { Command, ScannedProduct, SessionMutations } from '@/domain/models/types'

/**
 * Command (GoF) — Agregar un producto escaneado a la sesión.
 *
 * Encapsula la inserción del producto y su reversión (undo), apoyándose en las
 * mutaciones inyectadas (SessionMutations) para no acoplarse al store concreto.
 */
export class AddProductCommand implements Command {
  readonly label: string
  readonly canUndo = true

  constructor(
    private readonly product: ScannedProduct,
    private readonly mutations: SessionMutations,
  ) {
    this.label = 'Agregar ' + product.name
  }

  /** Inserta el producto en la sesión. */
  execute(): void {
    this.mutations.insertProduct(this.product)
  }

  /** Revierte la inserción eliminando la línea escaneada. */
  undo(): void {
    this.mutations.deleteProduct(this.product.scanId)
  }
}
