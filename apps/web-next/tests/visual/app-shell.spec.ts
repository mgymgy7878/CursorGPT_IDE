import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "serial" });

test("@visual app shell", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveScreenshot("dashboard-shell.png");
});


