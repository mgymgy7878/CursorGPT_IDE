import { test, expect } from "@playwright/test";

const WEB = process.env.WEB_ORIGIN ?? "http://localhost:3003";

test("UI smoke: parity page + local health", async ({ page, request }) => {
  await page.goto(`${WEB}/parity`);
  await expect(page.getByTestId("page-parity")).toBeVisible();

  const res = await request.get(`${WEB}/api/local/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBeTruthy();
  expect(json.service).toBe("web-next");
}); 