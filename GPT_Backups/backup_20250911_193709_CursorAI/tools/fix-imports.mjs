// tools/fix-imports.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", "dist", ".next", "build", "out"]);
const exts = new Set([".ts", ".tsx", ".mts", ".cts"]);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && exts.has(path.extname(e.name))) yield p;
  }
}

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;

let changed = 0;
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;

  src = src.replace(IMPORT_RE, (_, spec) => {
    let next = spec;
    if (spec.startsWith("@spark/types/")) next = "@spark/types";
    if (
      (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("@spark/")) &&
      spec.endsWith(".js")
    ) next = spec.slice(0, -3);
    return `from "${next}"`;
  });

  if (src !== before) {
    fs.writeFileSync(file, src, "utf8");
    changed++;
  }
}
console.log(`Rewrote ${changed} files`);
