import fs from "node:fs"; import path from "node:path";
const ROOT = "apps/web-next/app";
const hits = new Map();
function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && /\/page\.(t|j)sx?$/.test(p.replace(/\\/g,"/"))) {
      const key = p.replace(/.*app[\\/]/,"").replace(/[\\/]\(.*?\)/g,"/"); // route group'ları normalize et
      if (!hits.has(key)) hits.set(key, []);
      hits.get(key).push(p);
    }
  }
}
walk(ROOT);
let dup = 0;
for (const [k, arr] of hits) {
  if (arr.length > 1) { dup++; console.log("DUP:", k); for (const p of arr) console.log("  -", p); }
}
if (!dup) console.log("OK: No duplicate page routes.");
