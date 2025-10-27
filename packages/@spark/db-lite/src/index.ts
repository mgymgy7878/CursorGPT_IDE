/** Minimal in-memory DB shim (build-unblocker). */
export type KV<T = unknown> = { [key: string]: T };
export class DbLite {
  private store: KV = {};
  get<T = unknown>(k: string): T | undefined { return this.store[k] as T; }
  set<T = unknown>(k: string, v: T): void { this.store[k] = v as unknown; }
  del(k: string): void { delete this.store[k]; }
  keys(): string[] { return Object.keys(this.store); }
}
export const dbLite = new DbLite();
export default dbLite;
