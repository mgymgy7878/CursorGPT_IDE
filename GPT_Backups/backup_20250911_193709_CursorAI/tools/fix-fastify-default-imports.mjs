import fs from "node:fs"; import path from "node:path";
const exts = new Set([".ts",".tsx",".mts",".cts"]);
const IGNORE = new Set(["node_modules","dist",".next","build","out"]);
function* walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()){ if(!IGNORE.has(e.name)) yield* walk(p); }
  else if(e.isFile() && exts.has(path.extname(e.name))) yield p; } }
let rew=0;
for(const file of walk(process.cwd())){
  let src = fs.readFileSync(file,"utf8"), out = src;
  // import { fastify } from "fastify"  -> import fastify from "fastify"
  out = out.replace(/import\s*\{\s*fastify\s*\}\s*from\s*["']fastify["'];?/g, `import fastify from "fastify";`);
  // const fastify = require("fastify")  -> import fastify from "fastify"
  out = out.replace(/const\s+fastify\s*=\s*require\(["']fastify["']\);?/g, `import fastify from "fastify";`);
  // ensure type imports exist when fastify used
  if (out.includes(`import fastify from "fastify";`) && !/from\s+["']fastify["'].*FastifyInstance/.test(out)) {
    out = `import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";\n` + out;
  }
  if (out !== src) { fs.writeFileSync(file,out,"utf8"); rew++; }
}
console.log(`fix-fastify-default-imports: rewrote ${rew} files`);
