import fs from "node:fs"; import path from "node:path";
const targets = [];
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p = path.join(d,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile() && /^tsconfig(\.base)?(\.build)?\.json$/.test(e.name)) targets.push(p);
  }
}
walk(process.cwd());
let changed = 0;
for(const p of targets){
  const j = JSON.parse(fs.readFileSync(p,"utf8"));
  if (!j.compilerOptions) continue;
  if ("types" in j.compilerOptions) {
    delete j.compilerOptions.types;         // tür beyaz listesini tamamen kaldır
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
    console.log("REMOVED compilerOptions.types from", p);
    changed++;
  }
}
console.log("types-field removed in", changed, "tsconfig file(s)");
