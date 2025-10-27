import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.SNAPSHOT_DIR || "runtime/snapshots";

export async function snapshot(name: string, data: any) {
  await fs.mkdir(base, { recursive: true });
  
  const f = path.join(base, `${new Date().toISOString().replace(/[:.]/g, "-")}_${name}.json`);
  await fs.writeFile(f, JSON.stringify(data, null, 2));
  
  return f;
}

export async function retention(days = 7) {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const files = await fs.readdir(base).catch(() => []);
  
  await Promise.all(files.map(async fn => {
    const full = path.join(base, fn);
    try {
      const st = await fs.stat(full);
      if (st.mtimeMs < cutoff) {
        await fs.unlink(full);
      }
    } catch {}
  }));
} 