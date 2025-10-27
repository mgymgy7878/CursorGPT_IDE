import fs from "node:fs"; import path from "node:path";
const dir = "apps/web-next/pages";
if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
  const dst = "apps/web-next/_pages_legacy_disabled";
  if (!fs.existsSync(dst)) {
    fs.renameSync(dir, dst);
    console.log("RENAMED:", dir, "→", dst, "(App Router ile çakışma engellendi)");
  } else {
    console.log("ALREADY DISABLED:", dst);
  }
} else {
  console.log("OK: No legacy pages/ folder.");
}
