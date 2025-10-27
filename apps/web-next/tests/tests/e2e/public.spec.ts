import { test, expect } from "@playwright/test";

test("public ping is 200", async ({ request }) => {
  const res = await request.get("/api/public/ping");
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBeTruthy();
}); 