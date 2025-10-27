import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const LOG_PATH = "apps/web-next/.data/test-audit.log";

async function waitForFile(p: string, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, "utf8").trim();
      if (txt.length > 0) return txt;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

test("admin toggle writes an audit line", async ({ request }) => {
  try { fs.rmSync(LOG_PATH, { force: true }); } catch {}
  const res = await request.post("/api/admin/supervisor/toggle", {
    headers: { "x-dev-role": "admin", "content-type": "application/json" },
    data: { run: true }
  });
  expect(res.ok()).toBeTruthy();

  const txt = await waitForFile(LOG_PATH, 1200);
  expect(txt, "audit log not written").not.toBeNull();

  const lastLine = (txt as string).split(/\r?\n/).pop()!;
  const obj = JSON.parse(lastLine);
  expect(obj.ok).toBe(true);
  expect(obj.path).toContain("/api/admin/supervisor/toggle");
}); 