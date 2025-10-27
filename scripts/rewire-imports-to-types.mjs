import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby(["**/*.{ts,tsx}", "!node_modules/**", "!dist/**", "!**/GPT_Backups/**"]);
const map = new Map([
  [/@spark\/trading-core\/types/g, "@spark/types"],
  [/@spark\/strategy-codegen\/types/g, "@spark/types"]
]);

let changes = 0;
for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  let next = s;
  for (const [re, repl] of map) {
    next = next.replace(re, repl);
  }
  if (next !== s) {
    await fs.writeFile(f, next, "utf8");
    changes++;
  }
}

console.log(`Rewired ${changes} files pointing to @spark/types`); 