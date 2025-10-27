#!/usr/bin/env node
// POST /api/futures/order → expected: 403 + { confirm_required:true } (gate OFF)
// Usage: node scripts/dev/smoke-confirm.mjs --out docs/evidence/dev/v2.2-ui --symbol BTCUSDT --qty 0.001 --dry true
import fs from "fs";
import path from "path";
import os from "os";

const args = process.argv.slice(2);
const val = (k, d) => {
  const i = args.findIndex(a => a === `--${k}` || a.startsWith(`--${k}=`));
  if (i === -1) return d;
  const a = args[i];
  return a.includes("=") ? a.split("=")[1] : args[i+1];
};

const outDir = val("out", "docs/evidence/dev/v2.2-ui");
const symbol = val("symbol", "BTCUSDT");
const qty = Number(val("qty", "0.001"));
const dry = (val("dry", "true") + "").toLowerCase() !== "false"; // default true
const url = "http://127.0.0.1:4001/api/futures/order";

fs.mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
const outFile = path.join(outDir, `confirm_${ts}.txt`);

(async () => {
  const body = { symbol, side: "BUY", type: "MARKET", quantity: qty };
  const headers = { "Content-Type": "application/json" };
  if (dry) headers["x-dry-run"] = "true";
  let res, text;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    text = await res.text();
  } catch (e) {
    fs.writeFileSync(outFile, `# confirm @ ${new Date().toISOString()} host=${os.hostname()}\nERR ${e}\n`, "utf8");
    console.error("[smoke-confirm] request failed"); process.exit(1);
  }
  const ok = res.status === 403 && /confirm_required/i.test(text);
  const lines = [];
  lines.push(`# confirm @ ${new Date().toISOString()} host=${os.hostname()}`);
  lines.push(`status=${res.status} dry=${dry} url=${url}`);
  lines.push("--- headers ---");
  for (const [k,v] of res.headers) lines.push(`${k}: ${v}`);
  lines.push("--- body ---");
  lines.push(text.slice(0, 4000));
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  console.log(`[smoke-confirm] wrote ${outFile} ${ok ? "(OK 403+confirm_required)" : "(unexpected status)"}`);
  process.exit(ok ? 0 : 2);
})();
