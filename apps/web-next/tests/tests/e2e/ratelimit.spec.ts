import { test, expect } from "@playwright/test";

test("admin route hits RL → 429 with retry-after", async ({ request }) => {
  const path = "/api/admin/supervisor/toggle";
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const res = await request.post(path, {
      headers: { "x-dev-role": "admin", "content-type": "application/json" },
      data: { run: true }
    });
    if (res.status() === 429) {
      got429 = true;
      const ra = res.headers()["retry-after"];
      expect(ra).toBeTruthy();
      break;
    }
  }
  expect(got429).toBeTruthy();
}); 