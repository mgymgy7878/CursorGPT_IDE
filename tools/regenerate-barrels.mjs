// node tools/regenerate-barrels.mjs
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const PKG_GLOB = ["packages/*/src"]; // gerekirse services/*/src ekleyebilirsin

function makeIndexFor(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const exports = [];
  for (const e of entries) {
    const n = e.name;
    // atla
    if (n.startsWith("_") || n === "index.ts" || n === "index.tsx" || n.endsWith(".d.ts")) continue;
    if (n.endsWith(".test.ts") || n.endsWith(".spec.ts")) continue;
    if (e.isDirectory()) {
      exports.push(`export * from "./${n}";`);
    } else if (n.endsWith(".ts") || n.endsWith(".tsx")) {
      const base = n.replace(/\.tsx?$/, "");
      exports.push(`export * from "./${base}";`);
    }
  }
  exports.sort();
  const content = `/* AUTO-GENERATED: do not deep-import here */\n` + exports.join("\n") + "\n";
  fs.writeFileSync(path.join(dir, "index.ts"), content, "utf8");
}

for (const srcDir of await fg(PKG_GLOB, { cwd: ROOT })) {
  makeIndexFor(path.join(ROOT, srcDir));
}

console.log("barrels: regenerated with RELATIVE exports.");
