import path from "node:path";
import { readJSONFile, writeJSONFile, safeStat } from "./fs-helpers.js";

export type PersistedJob = {
  id: string;
  kind: "backtest" | "optimize";
  state: "queued" | "running" | "done" | "error" | "canceled";
  createdAt: number;
  updatedAt: number;
  input: any;
  output?: any;
  error?: { message: string; stack?: string } | undefined;
};

type StoreShape = { jobs: Record<string, PersistedJob> };

const STORE_FILE = path.join(process.cwd(), ".spark", "jobs.json");

async function loadAll(): Promise<StoreShape> {
  const exists = await safeStat(STORE_FILE);
  if (!exists) return { jobs: {} };
  const data = await readJSONFile<StoreShape>(STORE_FILE);
  if (!data || typeof data !== "object" || !data.jobs) return { jobs: {} };
  return data;
}

async function saveAll(state: StoreShape): Promise<void> {
  await writeJSONFile(STORE_FILE, state);
}

export class JobStore {
  private cache: StoreShape = { jobs: {} };
  private ready = false;

  private async ensureLoaded() {
    if (this.ready) return;
    this.cache = await loadAll();
    this.ready = true;
  }

  async put(job: PersistedJob): Promise<void> {
    await this.ensureLoaded();
    this.cache.jobs[job.id] = { ...job };
    await saveAll(this.cache);
  }

  async update(job: PersistedJob): Promise<void> {
    await this.ensureLoaded();
    const prev = this.cache.jobs[job.id];
    this.cache.jobs[job.id] = { ...(prev || {} as any), ...job };
    await saveAll(this.cache);
  }

  async get(id: string): Promise<PersistedJob | undefined> {
    await this.ensureLoaded();
    return this.cache.jobs[id];
  }

  async list(): Promise<PersistedJob[]> {
    await this.ensureLoaded();
    return Object.values(this.cache.jobs);
  }

  /**
   * Resume helper: returns jobs that may be resumed (e.g., running when process exited).
   * For now we just expose all; caller decides how to handle.
   */
  async resumeCandidates(): Promise<PersistedJob[]> {
    const all = await this.list();
    return all.filter(j => j.state === "running");
  }

  async cleanup(maxAgeMs: number = 7 * 24 * 3600 * 1000): Promise<number> {
    await this.ensureLoaded();
    const now = Date.now();
    let removed = 0;
    for (const [id, j] of Object.entries(this.cache.jobs)) {
      if ((j.state === "done" || j.state === "error" || j.state === "canceled") && (now - (j.updatedAt || j.createdAt)) > maxAgeMs) {
        delete this.cache.jobs[id];
        removed++;
      }
    }
    if (removed > 0) await saveAll(this.cache);
    return removed;
  }
}

export const jobStore = new JobStore();


