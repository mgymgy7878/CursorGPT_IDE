import fs from "node:fs"; import path from "node:path";
const banneds = new Set(["next/types","react","react-dom"]); // react* da yanlış eklenmişse temizle
function sweepTsconfig(p){
  const j = JSON.parse(fs.readFileSync(p,"utf8"));
  const co = j.compilerOptions || {};
  if (Array.isArray(co.types)) {
    const before = co.types.slice();
    co.types = co.types.filter(t => !banneds.has(String(t)));
    if (JSON.stringify(before) !== JSON.stringify(co.types)) {
      j.compilerOptions = co;
      fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
      console.log("CLEANED types in", p, "→", co.types);
    }
  }
}
function walk(d){
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    const p = path.join(d,e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && /^tsconfig(\.build)?\.json$/.test(e.name)) sweepTsconfig(p);
  }
}
walk(process.cwd());
