import { test, expect } from "@playwright/test";

test("protected /me requires role >= user", async ({ request }) => {
  const res403 = await request.get("/api/protected/me", { headers: { "x-dev-role": "public" } });
  expect([401,403]).toContain(res403.status());

  const res200 = await request.get("/api/protected/me", { headers: { "x-dev-role": "user" } });
  expect(res200.status()).toBe(200);
  const body = await res200.json();
  expect(body.dev).toBeTruthy();
});

test("admin /reload requires admin", async ({ request }) => {
  const r403 = await request.post("/api/admin/reload", { headers: { "x-dev-role": "user" } });
  expect([401,403]).toContain(r403.status());

  const r200 = await request.post("/api/admin/reload", { headers: { "x-dev-role": "admin" } });
  expect(r200.status()).toBe(200);
}); 