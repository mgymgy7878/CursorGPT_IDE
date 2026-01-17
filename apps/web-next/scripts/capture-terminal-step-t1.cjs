const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.UI_URL || 'http://127.0.0.1:3003/terminal';
const OUT_DIR = path.resolve(__dirname, '../../../evidence/assets/terminal_step_t1');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertNoScroll(page, label) {
  const metrics = await page.evaluate(() => {
    const container = document.querySelector('main > div');
    const root = document.documentElement;
    const terminal = document.querySelector('[data-testid="terminal-root"]');
    return {
      container: container
        ? { scrollHeight: container.scrollHeight, clientHeight: container.clientHeight }
        : null,
      root: { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight },
      terminal: terminal ? { height: terminal.getBoundingClientRect().height } : null,
    };
  });

  if (!metrics.container || !metrics.terminal) {
    throw new Error(`[${label}] Scroll container not found`);
  }

  const containerOk = metrics.terminal.height <= metrics.container.clientHeight + 1;
  const rootOk = metrics.root.scrollHeight <= metrics.root.clientHeight + 1;

  if (!containerOk || !rootOk) {
    throw new Error(
      `[${label}] Scroll overflow detected: terminal ${metrics.terminal.height}/${metrics.container.clientHeight}, root ${metrics.root.scrollHeight}/${metrics.root.clientHeight}`
    );
  }
}

async function assertPanels(page, label) {
  await page.getByTestId('terminal-root').waitFor({ timeout: 15000 });
  const panels = [
    'terminal-topbar',
    'terminal-sidebar',
    'terminal-marketwatch',
    'terminal-workspace',
  ];
  for (const id of panels) {
    const visible = await page.getByTestId(id).isVisible().catch(() => false);
    if (!visible) {
      throw new Error(`[${label}] Missing panel: ${id}`);
    }
  }
}

async function capture({ filename, viewport, rightOpen }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });

  await context.addInitScript((open) => {
    localStorage.setItem('ui.terminal.rightPanelOpen', open ? '1' : '0');
  }, rightOpen);

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((open) => {
    localStorage.setItem('ui.terminal.rightPanelOpen', open ? '1' : '0');
  }, rightOpen);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await sleep(1500);
  await assertPanels(page, filename);
  await assertNoScroll(page, filename);

  await page.screenshot({
    path: path.join(OUT_DIR, filename),
  });

  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await capture({
    filename: '01_terminal_1920.png',
    viewport: { width: 1920, height: 1080 },
    rightOpen: true,
  });

  await capture({
    filename: '02_terminal_1366_right_closed.png',
    viewport: { width: 1366, height: 768 },
    rightOpen: false,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
