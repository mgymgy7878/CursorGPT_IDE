import { test, expect } from "@playwright/test";

const WEB = process.env.WEB_ORIGIN ?? "http://localhost:3003";

test("proxy: GET /api/public/health → executor health 200", async ({ request }) => {
  const res = await request.get(`${WEB}/api/public/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBeTruthy();
  expect(json.service).toBe("executor");
});

test("proxy: POST body preserved → /api/public/echo", async ({ request }) => {
  const payload = { msg: "post-body-test", n: 42 };
  const res = await request.post(`${WEB}/api/public/echo`, {
    data: payload,
    headers: { "content-type": "application/json" },
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  // executor echo contract: { ok:true, echo:{...payload} }
  expect(json.ok).toBeTruthy();
  expect(json.echo).toMatchObject(payload);
}); 