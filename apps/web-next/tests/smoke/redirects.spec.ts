import { test, expect } from "@playwright/test";

test("@smoke /backtest-lab -> /backtest 308", async ({ request }) => {
  const res = await request.get("http://127.0.0.1:3003/backtest-lab", {
    maxRedirects: 0, failOnStatusCode: false
  });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("/backtest");
});

test("@smoke /home -> /dashboard 308", async ({ request }) => {
  const res = await request.get("http://127.0.0.1:3003/home", {
    maxRedirects: 0, failOnStatusCode: false
  });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("/dashboard");
});


