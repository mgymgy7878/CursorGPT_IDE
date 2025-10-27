import fs from "node:fs";
import path from "node:path";

export function checkAndMark(key: string, ttlMin = 3) {
  const dir = path.resolve(process.cwd(), "evidence", "canary", "idem");
  fs.mkdirSync(dir, { recursive: true });
  const now = Date.now();
  const file = path.join(dir, "keys.json");
  const map: Record<string, number> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  for (const k of Object.keys(map)) {
    if (map[k] !== undefined && now - map[k] > ttlMin * 60 * 1000) delete map[k];
  }
  const wasDuplicate = !!map[key];
  map[key] = now;
  fs.writeFileSync(file, JSON.stringify(map, null, 2), "utf8");
  return { key, wasDuplicate, ttlMin };
} 