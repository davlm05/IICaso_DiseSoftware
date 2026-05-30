import type { DomainEvent, DomainEventListener, DomainEventType } from '@/domain/models/types'

/**
 * Observer (GoF) — Subject de eventos de dominio.
 *
 * Desacopla a quien produce un cambio (p.ej. el escaneo de un producto) de
 * quienes reaccionan a él (Toast, analytics, etc.). La UI suele observar el
 * store de Zustand para datos; el EventBus se usa para efectos colaterales.
 */
export class EventBus {
  private listeners = new Map<DomainEventType, Set<DomainEventListener>>()

  /** Registra un observador y devuelve la función para desuscribirse. */
  subscribe<T = unknown>(type: DomainEventType, listener: DomainEventListener<T>): () => void {
    const set = this.listeners.get(type) ?? new Set<DomainEventListener>()
    set.add(listener as DomainEventListener)
    this.listeners.set(type, set)
    return () => {
      set.delete(listener as DomainEventListener)
    }
  }

  /** Notifica a todos los observadores del tipo de evento. */
  publish<T = unknown>(event: DomainEvent<T>): void {
    this.listeners.get(event.type)?.forEach((listener) => listener(event as DomainEvent))
  }

  /** Limpia todas las suscripciones (útil en tests). */
  clear(): void {
    this.listeners.clear()
  }
}

/** Instancia compartida (Singleton del Subject). */
export const eventBus = new EventBus()
