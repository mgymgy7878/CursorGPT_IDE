#!/usr/bin/env node

// @spark/* paketlerinde /src derin importları köke çevirir.
// Örn: from "@spark/shared/src/foo" -> from "@spark/shared"
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const root = process.cwd();
const globs = [
  "apps/**/*.{ts,tsx}",
  "services/**/*.{ts,tsx}",
  "packages/**/*.{ts,tsx}"
];

console.log('🔧 Derin import düzeltmesi başlatılıyor...');

const files = await fg(globs, { cwd: root, ignore: ["**/node_modules/**", "**/dist/**"] });
const RE = /from\s+["'](@spark\/[^"']+?)\/src(?:\/[^"']*)?["']/g;

let changed = 0;
for (const rel of files) {
  const file = path.join(root, rel);
  let txt = fs.readFileSync(file, "utf8");
  const next = txt.replace(RE, (_, pkg) => `from "${pkg}"`);
  if (next !== txt) {
    fs.writeFileSync(file, next);
    changed++;
    console.log(`✅ ${rel} - derin import düzeltildi`);
  }
}

console.log(`\n🎯 fix-import-specifiers: ${changed} dosya düzeltildi`);
