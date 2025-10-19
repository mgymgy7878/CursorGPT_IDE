import { test, expect, request } from "@playwright/test";

test("@smoke home 200 döner", async () => {
  const api = await request.newContext();
  const res = await api.get("http://127.0.0.1:3003/");
  expect(res.status()).toBe(200);
  const html = await res.text();
  // Next.js çıktısı olduğuna dair hafif bir kanıt
  expect(html).toContain('id="__next"');
});


