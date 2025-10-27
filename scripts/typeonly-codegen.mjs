import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby("packages/strategy-codegen/src/**/*.{ts,tsx}", { gitignore: true });
let changed = 0;

for (const f of files) {
  let s = await fs.readFile(f, "utf8"), b = s;
  
  // import { A,B } from '@spark/types'  →  import type { A,B } from '@spark/types'
  s = s.replace(/(^|\n)\s*import\s*{\s*([^}]*)\s*}\s*from\s*['"]@spark\/types['"]\s*;?/g,
                (m, p1, n) => `${p1}import type { ${n} } from '@spark/types';`);
  
  // import X, {A} from '@spark/types'  →  import type {A} from …  (default import kaldır)
  s = s.replace(/(^|\n)\s*import\s+([\w$]+)\s*,\s*{\s*([^}]*)\s*}\s*from\s*['"]@spark\/types['"]\s*;?/g,
                (m, p1, _d, n) => `${p1}import type { ${n} } from '@spark/types';`);
  
  if (s !== b) {
    await fs.writeFile(f, s, "utf8");
    changed++;
  }
}

console.log("strategy-codegen: type-only imports applied:", changed); 