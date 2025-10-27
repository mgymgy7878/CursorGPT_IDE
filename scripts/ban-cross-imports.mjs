import { globby } from "globby";
import fs from "node:fs/promises";

const bannedInTypes = [/from\s+['"]@spark\/(?!types)/];
const bannedInPackages = [/from\s+['"]@spark\/(executor|web|apps?)/];

const checks = [
  { root: "packages/types/src/**/*.ts", rules: bannedInTypes, label: "@spark/types" },
  { root: "packages/**/src/**/*.ts", rules: bannedInPackages, label: "packages/*" }
];

let bad = 0;
for (const c of checks) {
  const files = await globby(c.root, { gitignore: true });
  for (const f of files) {
    const s = await fs.readFile(f, "utf8");
    for (const r of c.rules) {
      if (r.test(s)) {
        console.log("FORBIDDEN IMPORT:", f);
        bad++;
        break;
      }
    }
  }
}

if (bad) {
  console.error("Forbidden imports found:", bad);
  process.exit(1);
}
console.log("Import boundary OK"); 