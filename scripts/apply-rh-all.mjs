import { globby } from "globby";
import fs from "node:fs/promises";

const files = await globby("services/executor/src/routes/**/*.ts", { gitignore: true });
for (const f of files) {
  let s = await fs.readFile(f, "utf8");
  if (!s.includes("@spark/common") && !s.includes(" RH<")) {
    if (!s.includes("import type { RH")) {
      s = `import type { RH, ApiRes } from "@spark/common";\n` + s;
    }
  }
  // annotate const xxxHandler = async (req, res) => ...
  s = s.replace(
    /const\s+(\w+Handler)\s*=\s*async\s*\(\s*([^)]+)\)\s*=>/g,
    (_, name, args) => `const ${name}: RH = async (${args}) =>`
  );
  await fs.writeFile(f, s, "utf8");
}
console.log("Applied RH to route handlers"); 