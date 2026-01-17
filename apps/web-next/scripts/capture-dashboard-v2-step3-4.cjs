const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.UI_URL || 'http://127.0.0.1:3003/dashboard';
const OUT_DIR = path.resolve(__dirname, '../../../evidence/assets/dashboard_v2_step3_4');
const VIEWPORT = { width: 1920, height: 1080 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertNoScroll(page, label) {
  const metrics = await page.evaluate(() => {
    const container = document.querySelector('main > div');
    const root = document.documentElement;
    const dash = document.querySelector('[data-testid="dashboard-v2-root"]');
    return {
      container: container
        ? { scrollHeight: container.scrollHeight, clientHeight: container.clientHeight }
        : null,
      root: { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight },
      dash: dash ? { height: dash.getBoundingClientRect().height } : null,
    };
  });

  if (!metrics.container || !metrics.dash) {
    throw new Error(`[${label}] Scroll container not found`);
  }

  const containerOk = metrics.dash.height <= metrics.container.clientHeight + 1;
  const rootOk = metrics.root.scrollHeight <= metrics.root.clientHeight + 1;

  if (!containerOk || !rootOk) {
    throw new Error(
      `[${label}] Scroll overflow detected: dash ${metrics.dash.height}/${metrics.container.clientHeight}, root ${metrics.root.scrollHeight}/${metrics.root.clientHeight}`
    );
  }
}

async function assertAIDecisions(page, label) {
  const card = page.getByTestId('ai-decisions-card');
  await card.waitFor({ timeout: 15000 });

  const itemCount = await page.getByTestId('ai-decision-item').count();
  const emptyVisible = await page.getByTestId('ai-decisions-empty').isVisible().catch(() => false);

  if (itemCount < 1 && !emptyVisible) {
    throw new Error(`[${label}] AI decisions empty-state or items not found`);
  }

  const demoVisible = await page
    .locator('[data-testid="dashboard-v2-root"] >> text=DEMO')
    .isVisible()
    .catch(() => false);
  if (demoVisible) {
    throw new Error(`[${label}] DEMO text found in UI`);
  }
}

async function capture({ filename, rightRailOpen }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });

  await context.addInitScript((railOpen) => {
    localStorage.setItem('spark.flags.dashboardv2', '1');
    localStorage.setItem('spark.flags.sparkdashboardv2', '1');
    localStorage.setItem('ui.rightRailOpen.v2', railOpen ? '1' : '0');
  }, rightRailOpen);

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((railOpen) => {
    localStorage.setItem('spark.flags.dashboardv2', '1');
    localStorage.setItem('spark.flags.sparkdashboardv2', '1');
    localStorage.setItem('ui.rightRailOpen.v2', railOpen ? '1' : '0');
  }, rightRailOpen);
  await page.reload({ waitUntil: 'domcontentloaded' });

  const v2Locator = page.locator('[data-testid="dashboard-v2-root"]');
  const v1Locator = page.locator('[data-testid="dashboard-v1-root"]');
  await v2Locator.waitFor({ timeout: 15000 });
  if (await v1Locator.isVisible().catch(() => false)) {
    throw new Error('Captured Dashboard V1; V2 flag not enabled');
  }

  await sleep(2500);
  await assertNoScroll(page, rightRailOpen ? 'right-open' : 'right-closed');
  await assertAIDecisions(page, rightRailOpen ? 'right-open' : 'right-closed');

  await page.screenshot({
    path: path.join(OUT_DIR, filename),
  });

  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await capture({
    filename: '01_fold_1920_right_closed.png',
    rightRailOpen: false,
  });

  await capture({
    filename: '02_fold_1920_right_open.png',
    rightRailOpen: true,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
