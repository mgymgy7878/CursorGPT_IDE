import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby(["**/*.{ts,tsx}", "!node_modules/**", "!dist/**", "!**/GPT_Backups/**"]);
let changes = 0;

for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  const before = s;
  
  // Flatten deep imports to barrel imports
  s = s.replace(/from\s+['"]@spark\/trading-core\/[^'"]+['"]/g, "from '@spark/trading-core'");
  s = s.replace(/from\s+['"]@spark\/strategy-codegen\/[^'"]+['"]/g, "from '@spark/strategy-codegen'");
  
  // Fail if packages import from services
  if (f.includes("packages/") && s.includes("from") && s.includes("services/")) {
    console.error(`❌ VIOLATION: ${f} imports from services/`);
    process.exit(1);
  }
  
  if (s !== before) {
    await fs.writeFile(f, s, "utf8");
    changes++;
  }
}

console.log(`✅ Flattened ${changes} files`); 