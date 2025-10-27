import fs from "node:fs"; import path from "node:path";
const MODS = ["@spark/shared","@spark/security","@spark/auth","@spark/agents","@spark/backtester","@spark/db-lite"];
const exts = [".ts",".tsx",".mts",".cts"];
const IGNORE = new Set(["node_modules",".next","dist","build","out"]);

function* walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()){ if(!IGNORE.has(e.name)) yield* walk(p); }
  else if(e.isFile() && exts.includes(path.extname(e.name))) yield p; } }

function scanImports(){
  const found = new Map(MODS.map(m=>[m,{names:new Set(), hasDefault:false}]));
  const RE = /import\s+([^'"]+)\s+from\s+['"](@spark\/[a-zA-Z0-9_-]+)['"]/g;
  for(const file of walk(process.cwd())){
    const src = fs.readFileSync(file,"utf8");
    let m; while((m = RE.exec(src))){
      const clause = m[1].trim(); const mod = m[2];
      if(!found.has(mod)) continue;
      const rec = found.get(mod);
      // default + named desenleri ayrıştır
      // örn: import Foo, { bar, baz as qux } from '@spark/shared'
      if (/^\w+(\s*,\s*\{[\s\S]*\})?$/.test(clause)) {
        const [def, rest] = clause.split(",");
        if (def && !def.includes("{")) rec.hasDefault = true;
        const named = (rest||"").match(/\{([\s\S]*?)\}/);
        if (named) {
          for (const n of named[1].split(",").map(s=>s.trim()).filter(Boolean)) {
            const name = n.includes(" as ") ? n.split(" as ")[1].trim() : n;
            if (name) rec.names.add(name);
          }
        }
      } else if (/^\{[\s\S]*\}$/.test(clause)) {
        const inside = clause.slice(1,-1);
        for (const n of inside.split(",").map(s=>s.trim()).filter(Boolean)) {
          const name = n.includes(" as ") ? n.split(" as ")[1].trim() : n;
          if (name) rec.names.add(name);
        }
      }
    }
  }
  return found;
}

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }

function writePkg(mod, names){
  const short = mod.split("/")[1];
  const dir = path.join("packages", `stub-${short}`);
  ensureDir(path.join(dir,"src"));
  // package.json
  const pkg = {
    name: mod, version: "0.0.0-stub", private: true, type: "module",
    main: "dist/index.js", types: "dist/index.d.ts", sideEffects: false,
    scripts: { build: "tsup src/index.ts --dts --format esm --target node18 --out-dir dist" },
    devDependencies: { tsup: "^8.0.1", typescript: "^5.5.0" }
  };
  fs.writeFileSync(path.join(dir,"package.json"), JSON.stringify(pkg,null,2)+"\n","utf8");
  // tsconfig
  const ts = { extends: "../../tsconfig.base.json", compilerOptions: { module: "ESNext", moduleResolution: "Bundler", declaration: true, outDir: "dist", skipLibCheck: true }, include:["src"] };
  fs.writeFileSync(path.join(dir,"tsconfig.json"), JSON.stringify(ts,null,2)+"\n","utf8");
  // index.ts (default + named exported any)
  const lines = [];
  lines.push("// AUTO-GENERATED STUB. Replace with real impls when ready.");
  for(const n of names) lines.push(`export const ${n} : any = undefined as any;`);
  lines.push("const __default: any = {}; export default __default;");
  fs.writeFileSync(path.join(dir,"src","index.ts"), lines.join("\n")+"\n","utf8");
  return dir;
}

const found = scanImports();
const created = [];
for (const [mod, rec] of found) {
  if (!rec.hasDefault && rec.names.size===0) continue; // hiç import yoksa paket oluşturma
  created.push(writePkg(mod, rec.names));
}
console.log("Created/updated stub packages:", created);
