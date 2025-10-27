import fs from "node:fs/promises";
import path from "node:path";

type Enqueued<T> = { id: number; ts: number; payload: T };

export class DurableQueue<T = any> {
  private dir: string;
  private journal: string;
  private cursorFile: string;
  private head = 0;
  private lastId = 0;
  private cache: Enqueued<T>[] = [];
  private visMap = new Map<number, number>();

  constructor(dir: string, name: string) {
    this.dir = path.join(dir, name);
    this.journal = path.join(this.dir, "journal.ndjson");
    this.cursorFile = path.join(this.dir, "cursor.txt");
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    
    try {
      this.head = Number(await fs.readFile(this.cursorFile, "utf8")) || 0;
    } catch {}

    try {
      const txt = await fs.readFile(this.journal, "utf8").catch(() => "");
      const lines = txt.trim() === "" ? [] : txt.trim().split(/\r?\n/);
      this.cache = lines.map(l => JSON.parse(l)).sort((a, b) => a.id - b.id);
      this.lastId = this.cache.at(-1)?.id ?? 0;
    } catch {}
  }

  async enqueue(payload: T) {
    const rec: Enqueued<T> = { 
      id: ++this.lastId, 
      ts: Date.now(), 
      payload 
    };
    
    await fs.appendFile(this.journal, JSON.stringify(rec) + "\n");
    this.cache.push(rec);
    
    return rec.id;
  }

  async claimNext(visibilityMs: number) {
    const next = this.cache.find(x => x.id > this.head && !this.visMap.has(x.id));
    if (!next) return null;
    
    this.visMap.set(next.id, Date.now() + visibilityMs);
    return next;
  }

  async ack(id: number) {
    if (id <= this.head) return;
    
    this.head = id;
    this.visMap.delete(id);
    await fs.writeFile(this.cursorFile, String(this.head));
  }

  async extend(id: number, extraMs: number) {
    const exp = this.visMap.get(id);
    if (exp) this.visMap.set(id, exp + extraMs);
  }

  reapExpired() {
    const now = Date.now();
    for (const [id, exp] of this.visMap) {
      if (exp < now) this.visMap.delete(id);
    }
  }

  stats() {
    return {
      head: this.head,
      lastId: this.lastId,
      inflight: this.visMap.size,
      queued: this.cache.filter(x => x.id > this.head).length
    };
  }
} 