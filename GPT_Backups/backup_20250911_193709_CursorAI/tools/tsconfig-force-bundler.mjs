// Tüm tsconfig*.json dosyalarında NodeNext izlerini Bundler/ESNext'e çevirir.
import fs from "node:fs";
import path from "node:path";

const exts = new Set(["tsconfig.json","tsconfig.build.json"]);
const touched = [];
function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && exts.has(e.name)) {
      try {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        const co = j.compilerOptions ?? (j.compilerOptions = {});
        let changed = false;
        if (co.moduleResolution !== "Bundler") { co.moduleResolution = "Bundler"; changed = true; }
        if (co.module !== "ESNext") { co.module = "ESNext"; changed = true; }
        if (changed) {
          fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
          touched.push(p);
        }
      } catch {}
    }
  }
}
walk(process.cwd());
console.log(`FORCED Bundler/ESNext in ${touched.length} tsconfig files`);
for (const t of touched) console.log(" -", t);
