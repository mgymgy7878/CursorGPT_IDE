// tools/generate-types-barrel.mjs
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("packages/types/src");
const INDEX = path.join(SRC, "index.ts");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (
      e.isFile() &&
      e.name.endsWith(".ts") &&
      e.name !== "index.ts" &&
      !e.name.endsWith(".d.ts") &&
      !e.name.startsWith("_")
    ) {
      out.push(p);
    }
  }
  return out;
}

function toRel(p) {
  const rel = path.relative(SRC, p).replace(/\\/g, "/").replace(/\.ts$/, "");
  return `./${rel}`;
}

const files = walk(SRC).sort();
const lines = [
  "// AUTO-GENERATED: do not edit manually",
  ...files.map(f => `export * from "${toRel(f)}";`),
  ""
];

fs.writeFileSync(INDEX, lines.join("\n"), "utf8");
console.log(`Wrote barrel with ${files.length} modules → ${INDEX}`);
