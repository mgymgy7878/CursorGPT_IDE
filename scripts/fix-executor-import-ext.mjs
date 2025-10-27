import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby("services/executor/src/**/*.{ts,tsx}", { gitignore:true });
const re = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  const next = s.replace(re, (m,p)=>{
    if (/\.(js|ts|tsx|json)$/.test(p)) return m;
    return m.replace(p, `${p}.js`);
  });
  if (next !== s) {
    await fs.writeFile(f, next, "utf8");
    console.log(`Fixed imports in: ${f}`);
  }
}

console.log("executor .js extension pass complete"); 