export type EventMap = Record<string, object>;
export class TypedEventBus<Events extends EventMap> {
  private readonly handlers = new Map<keyof Events, Set<(event: Events[keyof Events]) => void>>();
  on<K extends keyof Events>(type: K, handler: (event: Events[K]) => void): () => void { const set = this.handlers.get(type) ?? new Set(); this.handlers.set(type, set); const erased = handler as (event: Events[keyof Events]) => void; set.add(erased); return () => set.delete(erased); }
  emit<K extends keyof Events>(type: K, event: Events[K]): void { this.handlers.get(type)?.forEach((handler) => handler(event)); }
}
