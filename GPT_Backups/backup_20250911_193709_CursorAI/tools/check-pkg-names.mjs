// tools/check-pkg-names.mjs
import fs from "node:fs";
import path from "node:path";

const roots = ["packages", "services", "apps"];
const pkgs = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  for (const d of fs.readdirSync(r)) {
    const pj = path.join(r, d, "package.json");
    if (fs.existsSync(pj)) {
      try {
        const j = JSON.parse(fs.readFileSync(pj, "utf8"));
        pkgs.push({ name: j.name, dir: `${r}/${d}`, private: !!j.private });
      } catch {}
    }
  }
}
const map = new Map();
for (const p of pkgs) {
  if (!p.name) continue;
  if (!map.has(p.name)) map.set(p.name, []);
  map.get(p.name).push(p);
}
let dup = 0;
for (const [name, items] of map.entries()) {
  if (items.length > 1) {
    dup++;
    console.log(`DUPLICATE: ${name}`);
    for (const it of items) console.log(`  - ${it.dir} ${it.private ? "(private)" : ""}`);
  }
}
if (dup === 0) {
  console.log("OK: No duplicate package names in workspace.");
  process.exit(0);
} else {
  console.error(`FOUND ${dup} duplicate name(s).`);
  process.exit(2);
}
