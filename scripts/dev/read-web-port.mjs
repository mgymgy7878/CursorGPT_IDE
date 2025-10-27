#!/usr/bin/env node
// Prints the web port from the latest run_*/WEB_PORT.txt, falls back to 3003.
import fs from "fs";
import path from "path";

const base = path.join("docs","evidence","dev","v2.2-ui");
if (!fs.existsSync(base)) { console.log("3003"); process.exit(0); }

const runs = fs.readdirSync(base)
  .filter(n => n.startsWith("run_"))
  .map(n => ({ n, t: fs.statSync(path.join(base,n)).mtimeMs }))
  .sort((a,b)=>b.t-a.t);

for (const r of runs) {
  const p = path.join(base, r.n, "WEB_PORT.txt");
  if (fs.existsSync(p)) {
    const v = fs.readFileSync(p, "utf8").trim();
    const num = Number(v);
    if (Number.isInteger(num) && num > 0) { console.log(num); process.exit(0); }
  }
}
console.log("3003");
