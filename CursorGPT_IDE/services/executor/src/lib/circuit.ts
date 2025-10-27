import fs from "node:fs";
import path from "node:path";

export function hitAndCheck(windowSec = 60, maxPerWindow = Number(process.env.LIVE_CIRCUIT_MAX_PER_MIN ?? 2)) {
  const dir = path.resolve(process.cwd(), "evidence", "canary", "circuit");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "window.json");
  const now = Date.now();
  const winStart = now - windowSec * 1000;
  const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { times: [] };
  const times: number[] = Array.isArray(current.times) ? current.times : [];
  const pruned = times.filter((t) => t >= winStart);
  pruned.push(now);
  fs.writeFileSync(file, JSON.stringify({ times: pruned }, null, 2), "utf8");
  const countInWindow = pruned.length;
  const tripped = countInWindow > maxPerWindow;
  return { windowSec, maxPerWindow, countInWindow, tripped };
} 