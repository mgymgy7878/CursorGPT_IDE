#!/usr/bin/env node
// Kullanım: node tools/guards/cursor-header-guard.js <dosya|klasör>...
const fs = require("fs"), path = require("path");
const targets = process.argv.slice(2);
if (!targets.length) { console.error("HATA: Denetlenecek dosya/klasör verin."); process.exit(2); }

let bad = [];
function scan(p){
  const st = fs.statSync(p);
  if (st.isDirectory()){
    for (const f of fs.readdirSync(p)) scan(path.join(p, f));
  } else {
    if (!/\.(md|txt|log)$/i.test(p)) return;
    const txt = fs.readFileSync(p, "utf8");
    const firstLine = txt.split(/\r?\n/)[0] || "";
    // Etiket: tam 1. satırın başında "cursor (" ile başlamalı ve ") :" ile bitmeli
    const ok = /^cursor\s*\(.+?\):\s*/i.test(firstLine);
    if (!ok && /cursor\s*\(.+?\):\s*/i.test(txt)) bad.push(p); // dosyada var ama başta değil
  }
}
for (const t of targets){ if (fs.existsSync(t)) scan(t); }
if (bad.length){
  console.error("Cursor Header Guard: Aşağıdaki dosyalarda etiket 1. satırda değil:");
  for (const f of bad) console.error(" - " + f);
  console.error("Düzeltmek için: pnpm run fix:cursor");
  process.exit(1);
} else {
  console.log("Cursor Header Guard: OK");
} 