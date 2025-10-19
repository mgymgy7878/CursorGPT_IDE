import { createHash } from "crypto";
import fs from "fs";
import path from "path";

const repo = process.cwd();
const nav = fs.readFileSync(path.join(repo, "apps/web-next/src/config/nav.json"), "utf8");
const routes = fs.readFileSync(path.join(repo, "apps/web-next/src/config/routes.ts"), "utf8");
const tailwindPathTs = path.join(repo, "apps/web-next/tailwind.config.ts");
const tailwindPathJs = path.join(repo, "apps/web-next/tailwind.config.js");
const tailwind = fs.readFileSync(fs.existsSync(tailwindPathTs) ? tailwindPathTs : tailwindPathJs, "utf8");

const payload = JSON.stringify({ nav, routes, tailwind });
const hash = createHash("sha256").update(payload).digest("hex").slice(0, 12);

const mode = process.argv[2];
if (mode === "--print") {
  console.log(`UX-ACK:${hash}`);
  process.exit(0);
}

const expected = process.env.UX_ACK;
if (expected && expected !== `UX-ACK:${hash}`) {
  console.error(`Mismatch! expected=${expected} actual=UX-ACK:${hash}`);
  process.exit(2);
}

console.log(`UX-ACK:${hash}`);


