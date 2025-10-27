import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const exts = new Set([".ts", ".tsx", ".mts", ".cts"]);
const IGNORE = new Set(["node_modules","dist",".next","build","out"]);

function* walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()){ if(!IGNORE.has(e.name)) yield* walk(p); }
  else if(e.isFile() && exts.has(path.extname(e.name))) yield p; } }

let rew=0, ann=0;
for(const file of walk(ROOT)){
  let src=fs.readFileSync(file,"utf8"), out=src;

  // 1) Yanlış fastify import yollarını düzelt
  out = out
    .replace(/from\s+['"]fastify\/types['"]/g, `from "fastify"`)
    .replace(/from\s+['"]fastify\/\w+['"]/g, `from "fastify"`);

  // 2) Tip anotasyonlarında FastifyBaseLogger → FastifyInstance
  out = out.replace(/:\s*FastifyBaseLogger\b/g, `: FastifyInstance`);

  // 3) Eksik type importlarını eklemek için üst satıra güvenli ek (idempotent)
  if (out !== src && !/from\s+['"]fastify['"].*\bFastifyInstance\b/.test(out)) {
    out = out.replace(/(^\s*import[^\n]*\n)/, (m) => m + `import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";\n`);
    ann++;
  }
  if (out !== src) { fs.writeFileSync(file,out,"utf8"); rew++; }
}

console.log(`fix-fastify-imports: rewrote ${rew} files, added type imports in ${ann} files`);
