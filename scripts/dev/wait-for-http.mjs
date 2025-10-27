#!/usr/bin/env node
// Poll given URLs until ready, then dump minimal evidence.
// Usage: node scripts/dev/wait-for-http.mjs --out docs/evidence/dev/v2.2-ui \
//   --url http://127.0.0.1:4001/api/futures/time \
//   --url http://127.0.0.1:3003/api/public/metrics
import fs from "fs";
import path from "path";
import os from "os";

const args = process.argv.slice(2);
const vals = (k) => args.flatMap((a,i)=> (a===k? [args[i+1]] : (a.startsWith(k+"=")? [a.split("=")[1]]: [])));
const outDir = vals("--out")[0] || "docs/evidence/dev/v2.2-ui";
const urls = vals("--url");
const timeoutSec = Number(vals("--timeout")[0] || 60);
const intervalMs = Number(vals("--interval")[0] || 1500);

if (urls.length===0) { console.error("No --url provided"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g,"").slice(0,15);
const outFile = path.join(outDir, `smoke_core_${ts}.txt`);

async function waitUrl(u){
  const start = Date.now();
  while (Date.now()-start < timeoutSec*1000){
    try{
      const r = await fetch(u, { method: "GET" });
      if (r.ok || r.status===403){
        const head = [...r.headers.entries()].slice(0,6).map(([k,v])=>`${k}: ${v}`).join("\n");
        const body = await r.text();
        return { url:u, status:r.status, ok:true, head, body: body.slice(0,4000) };
      }
    }catch{}
    await new Promise(res=>setTimeout(res, intervalMs));
  }
  return { url:u, status:0, ok:false, head:"", body:"" };
}

(async ()=>{
  const results = [];
  for (const u of urls){ results.push(await waitUrl(u)); }
  const lines = [];
  lines.push(`# smoke_core @ ${new Date().toISOString()} host=${os.hostname()}`);
  for (const r of results){
    lines.push(`\n=== ${r.url} → status=${r.status} ok=${r.ok} ===`);
    if (!r.ok) { lines.push("TIMEOUT"); continue; }
    lines.push(r.head);
    lines.push("---");
    lines.push(r.body);
  }
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  const anyFail = results.some(r=>!r.ok);
  console.log(`[smoke-core] wrote ${outFile}${anyFail?" (with timeouts)":" (OK)"}`);
  if (anyFail){ process.exit(1); }
})();
