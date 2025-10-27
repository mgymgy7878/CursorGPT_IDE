import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "tsconfig.base.json");
if (!fs.existsSync(TARGET)) {
  console.error("FATAL: tsconfig.base.json kökte yok:", TARGET);
  process.exit(1);
}

function listTsconfigs(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      out.push(...listTsconfigs(p));
    } else if (name.isFile() && name.name === "tsconfig.json") {
      out.push(p);
    }
  }
  return out;
}

const roots = [path.join(ROOT, "packages", "@spark"), path.join(ROOT, "packages")];
const seen = new Set();
const files = [];
for (const r of roots) {
  if (fs.existsSync(r)) {
    for (const f of listTsconfigs(r)) {
      if (f.includes(path.join("node_modules", ""))) continue;
      if (seen.has(f)) continue;
      seen.add(f);
      files.push(f);
    }
  }
}

// normalize to posix style (TS severler için güvenli)
const toPosix = p => p.split(path.sep).join("/");

const changes = [];
for (const f of files) {
  try {
    const raw = fs.readFileSync(f, "utf8");
    const json = JSON.parse(raw);
    const dir = path.dirname(f);
    const rel = toPosix(path.relative(dir, TARGET)); // ../../.. /tsconfig.base.json
    if (!json.extends || json.extends !== rel) {
      const before = json.extends ?? "(none)";
      json.extends = rel;
      fs.writeFileSync(f, JSON.stringify(json, null, 2) + "\n");
      changes.push({ file: toPosix(path.relative(ROOT, f)), before, after: rel });
    }
  } catch (e) {
    console.error("WARN: tsconfig işlenemedi:", f, e.message);
  }
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0,14);
const evidDir = path.join("evidence", "local", "tsconfig-fix", stamp);
fs.mkdirSync(evidDir, { recursive: true });
fs.writeFileSync(path.join(evidDir, "changes.json"), JSON.stringify({ TARGET: toPosix(path.relative(ROOT, TARGET)), changes }, null, 2));
console.log("EVIDENCE_DIR="+toPosix(evidDir));
console.log("CHANGES", changes);
