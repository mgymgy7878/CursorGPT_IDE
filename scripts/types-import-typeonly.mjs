import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby(["**/*.{ts,tsx}", "!node_modules/**", "!dist/**", "!**/GPT_Backups/**"]);
let changed = 0;

for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  const before = s;
  
  // import { A,B } from '@spark/types'  →  import type { A,B } from '@spark/types'
  s = s.replace(/(^|\n)\s*import\s*{\s*([^}]*)\s*}\s*from\s*['"]@spark\/types['"]\s*;?/g,
                (m, p1, names) => `${p1}import type { ${names} } from '@spark/types';`);
  
  // import X, {A} from '@spark/types'  →  import type {A} from …  (default import kaldır)
  s = s.replace(/(^|\n)\s*import\s*([\w$]+)\s*,\s*{\s*([^}]*)\s*}\s*from\s*['"]@spark\/types['"]\s*;?/g,
                (m, p1, _def, names) => `${p1}import type { ${names} } from '@spark/types';`);
  
  if (s !== before) {
    await fs.writeFile(f, s, "utf8");
    changed++;
  }
}

console.log("Type-only imports applied:", changed); 