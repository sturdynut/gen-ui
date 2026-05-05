export class StateStore {
  private data = new Map<string, unknown>();
  private subs = new Map<string, Set<() => void>>();

  constructor(initial?: Record<string, unknown>) {
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        this.data.set(k, v);
      }
    }
  }

  get<T = unknown>(path: string): T | undefined {
    return this.data.get(path) as T | undefined;
  }

  set(path: string, value: unknown): void {
    this.data.set(path, value);
    this.notify(path);
  }

  toggle(path: string): void {
    this.set(path, !this.data.get(path));
  }

  inc(path: string, by = 1): void {
    const cur = (this.data.get(path) as number | undefined) ?? 0;
    this.set(path, cur + by);
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }

  subscribe(path: string, cb: () => void): () => void {
    if (!this.subs.has(path)) this.subs.set(path, new Set());
    this.subs.get(path)!.add(cb);
    return () => this.subs.get(path)?.delete(cb);
  }

  private notify(path: string): void {
    this.subs.get(path)?.forEach(cb => cb());
  }
}
