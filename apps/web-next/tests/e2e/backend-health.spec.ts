import { test, expect } from "@playwright/test";

test("Backend health on /api/public/health returns ok", async ({ request }) => {
  // Next rewrites proxies http://localhost:3003/api/* -> backend:4001/*
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3003";
  const res = await request.get(`${base}/api/public/health`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.service).toBe("executor");
}); 