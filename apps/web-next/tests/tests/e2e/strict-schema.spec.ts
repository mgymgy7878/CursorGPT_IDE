import { test, expect } from "@playwright/test";

test("STRICT schema 400 when required fields missing", async ({ request }) => {
  const r = await request.post("/api/admin/strategy/optimize", {
    headers: { "x-dev-role": "admin", "content-type": "application/json" },
    data: {}
  });
  expect(r.status()).toBe(400);
}); 