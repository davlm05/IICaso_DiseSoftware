import type { Command, QrTicket, SessionMutations } from '@/domain/models/types'

/**
 * Command (GoF) — Generar el ticket QR de validación de la sesión.
 *
 * Al deshacer, retira el ticket (setQrTicket(null)) para volver al estado previo
 * a la generación.
 */
export class GenerateQRCommand implements Command {
  readonly label = 'Generar QR'
  readonly canUndo = true

  constructor(
    private readonly ticket: QrTicket,
    private readonly mutations: SessionMutations,
  ) {}

  /** Fija el ticket QR en la sesión. */
  execute(): void {
    this.mutations.setQrTicket(this.ticket)
  }

  /** Revierte la generación retirando el ticket. */
  undo(): void {
    this.mutations.setQrTicket(null)
  }
}
