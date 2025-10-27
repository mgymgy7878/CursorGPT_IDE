#!/usr/bin/env node
// Pin all workflows: runs pin-actions.mjs for each .yml/.yaml in .github/workflows
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = ".github/workflows";
if (!fs.existsSync(dir)) {
  console.error(`[pin-all] ${dir} not found`);
  process.exit(1);
}
const files = fs.readdirSync(dir).filter(f => /\.(ya?ml)$/i.test(f));
if (files.length === 0) {
  console.log("[pin-all] no workflows");
  process.exit(0);
}
for (const f of files) {
  const full = path.join(dir, f);
  console.log(`[pin-all] pinning ${full} ...`);
  const r = spawnSync("node", [path.join(__dirname, "pin-actions.mjs"), full], {
    stdio: "inherit",
    env: process.env
  });
  if (r.status !== 0) {
    console.error(`[pin-all] failed on ${f}`);
    process.exit(r.status ?? 1);
  }
}
console.log("[pin-all] done");


