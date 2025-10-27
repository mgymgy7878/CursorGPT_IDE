// node tools/infer-events.mjs
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const PATTERNS = [
  'emit\\(\\s*["\'`]([^"\']+)["\'`]',
  'on\\(\\s*["\'`]([^"\']+)["\'`]'
];
const re = new RegExp(PATTERNS.join("|"), "g");

const files = await fg(["**/*.{ts,tsx}"], {
  cwd: ROOT,
  ignore: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"]
});

const events = new Set();
for (const rel of files) {
  const txt = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const m of txt.matchAll(re)) {
    const evt = m[1] || m[2];
    if (evt && !evt.startsWith("vite:") && !evt.includes("${") && !evt.includes("`")) {
      events.add(evt);
    }
  }
}

const lines = [
  "/* AUTO-GENERATED – refine per event as needed */",
  "declare module \"@spark/types\" {",
  "  interface LabEvents {"
];
for (const e of Array.from(events).sort()) {
  lines.push(`    "${e}": Record<string, unknown>;`);
}
lines.push("  }", "}", "export {};");
const outPath = path.join(ROOT, "types", "events.augment.d.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`inferred ${events.size} events → ${outPath}`);
