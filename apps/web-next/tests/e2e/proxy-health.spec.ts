import { test, expect } from "@playwright/test";

test("proxy health + echo preserves body", async ({ request }) => {
  const ui = await request.get("http://localhost:3003/api/local/health");
  expect(ui.ok()).toBeTruthy();

  const prox = await request.get("http://localhost:3003/api/public/health");
  expect(prox.ok()).toBeTruthy();

  const echo = await request.post("http://localhost:3003/api/public/echo", {
    data: { msg: "test" },
    headers: { "Content-Type": "application/json" },
  });
  expect(echo.ok()).toBeTruthy();
  const json = await echo.json();
  expect(json?.body?.msg).toBe("test");
}); 