import type { Command } from '@/domain/models/types'

/**
 * Command (GoF) — Invoker.
 *
 * Ejecuta comandos y mantiene una pila (history) de los que admiten undo para
 * poder deshacerlos en orden LIFO. Es agnóstico al comando concreto.
 */
export class CommandBus {
  private stack: Command[] = []

  /** Ejecuta el comando y lo apila en el historial si admite undo. */
  dispatch(command: Command): void {
    command.execute()
    if (command.canUndo) {
      this.stack.push(command)
    }
  }

  /** Deshace el último comando del historial. Devuelve false si está vacío. */
  undo(): boolean {
    const command = this.stack.pop()
    if (!command) {
      return false
    }
    command.undo()
    return true
  }

  /** Indica si hay algún comando que pueda deshacerse. */
  canUndo(): boolean {
    return this.stack.length > 0
  }

  /** Vacía el historial (útil al cerrar/reiniciar la sesión y en tests). */
  clear(): void {
    this.stack = []
  }

  /** Vista de solo lectura del historial de comandos deshacibles. */
  get history(): readonly Command[] {
    return this.stack
  }
}

/** Instancia compartida (Singleton del Invoker). */
export const commandBus = new CommandBus()
