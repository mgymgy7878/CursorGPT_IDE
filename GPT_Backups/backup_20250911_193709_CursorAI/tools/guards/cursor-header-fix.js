#!/usr/bin/env node
const fs = require("fs"), path = require("path");
const targets = process.argv.slice(2); if (!targets.length){ console.log("Kullanım: node tools/guards/cursor-header-fix.js <dosya|klasör>..."); process.exit(0); }

function apply(p){
  const st = fs.statSync(p);
  if (st.isDirectory()){ for (const f of fs.readdirSync(p)) apply(path.join(p,f)); return; }
  if (!/\.(md|txt|log)$/i.test(p)) return;
  let txt = fs.readFileSync(p,"utf8");
  if (/^cursor\s*\(.+?\):\s*/i.test(txt.split(/\r?\n/)[0]||"")) return; // zaten doğru
  const m = txt.match(/cursor\s*\(.+?\):\s*.*/i);
  if (!m) return; // hiç cursor yoksa dokunma
  const header = m[0].trim();
  // ESKİ header'ı kaldır, en üste ekle
  txt = txt.replace(m[0], "").replace(/^\s*\r?\n/, ""); // ilk boş satırı temizle
  const fixed = header + "\n" + txt;
  fs.writeFileSync(p, fixed, "utf8");
  console.log("Fixed:", p);
}
for (const t of targets){ if (fs.existsSync(t)) apply(t); }
console.log("Done."); 