import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";

const allow = new Set([
  "@spark/types",
  "@spark/types/events",
  "@spark/types/canary"
]);

const files = await fg(["**/*.{ts,tsx,mts,cts}"], {
  dot: false,
  onlyFiles: true,
  ignore: ["**/node_modules/**","**/dist/**","**/.next/**","**/pages_disabled/**","**/pages-disabled/**","**/pages__disabled/**"]
});

let violations = [];
for (const f of files) {
  const src = await readFile(f, "utf8");
  const rx = /from\s+["'](@spark\/types\/[^"']+)["']|require\(\s*["'](@spark\/types\/[^"']+)["']\s*\)/g;
  let m;
  while ((m = rx.exec(src))) {
    const spec = m[1] || m[2];
    if (!allow.has(spec)) violations.push({ file: f, spec });
  }
}

if (violations.length) {
  console.error("Deep import violations:");
  for (const v of violations) console.error(` - ${relative(process.cwd(), v.file)} ⇒ ${v.spec}`);
  process.exit(1);
} else {
  console.log("OK deep-import-guard (no forbidden imports)");
} 