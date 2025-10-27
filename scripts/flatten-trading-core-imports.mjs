import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby(["**/*.{ts,tsx}", "!node_modules/**", "!dist/**", "!**/GPT_Backups/**"]);
for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  const before = s;
  s = s.replace(/from\s+['"]@spark\/trading-core\/[^'"]+['"]/g, "from '@spark/trading-core'");
  if (s !== before) await fs.writeFile(f, s, "utf8");
}
console.log("flattened @spark/trading-core deep imports"); 