// Evidence capture helper: Dashboard V2 Step 3.2 screenshots
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.UI_URL || 'http://127.0.0.1:3003/dashboard';
const OUT_DIR = path.resolve(__dirname, '../../../evidence/assets/dashboard_v2_step3_2');

const VIEWPORT = { width: 1600, height: 900 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildLiveStatus() {
  return {
    api: { ok: true },
    feed: { ok: true, stalenessSec: 2 },
    executor: { ok: true, latencyMs: 12 },
    metrics: {
      p95Ms: 12,
      rtDelayMs: 3,
      tradeCount: 42,
      volumeUsd: '1.2M',
      alerts: { active: 1, total: 3, todayTriggered: 1 },
    },
  };
}

function buildSummary({
  dataQuality,
  prices,
  changes,
}) {
  const nowIso = new Date().toISOString();
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  const marketSymbols = symbols.map((symbol, index) => ({
    symbol,
    price: prices[index],
    change24h: changes[index],
  }));

  return {
    system: {
      api: { ok: true },
      feed: { ok: dataQuality === 'live', stalenessSec: dataQuality === 'live' ? 2 : 999 },
      executor: { ok: true, latencyMs: 12 },
    },
    latency: {
      p95Ms: 12,
      targetMs: 1200,
    },
    portfolio: {
      totalAsset: 124592,
      dailyPnL: 1240.5,
      marginLevel: 1240,
    },
    market: {
      symbols: marketSymbols,
    },
    strategies: {
      active: 12,
      paused: 0,
      totalPnL24h: 1530,
      top: [
        { name: 'BTC Mean Rev', market: 'Crypto', status: 'running', pnl24hUsd: 450 },
        { name: 'Gold Trend', market: 'Commodities', status: 'running', pnl24hUsd: 1200 },
        { name: 'ETH Scalp', market: 'Crypto', status: 'paused', pnl24hUsd: -120 },
      ],
      sourceHealth: dataQuality === 'live' ? 'ok' : 'timeout',
      dataQuality,
    },
    risk: {
      dailyDrawdown: 0.012,
      exposure: 0.65,
      level: 'moderate',
    },
    aiDecisions: {
      recent: [
        { action: 'BUY', symbol: 'BTCUSDT', reason: 'RSI Oversold', confidence: 0.98, ts: nowIso },
      ],
      sourceHealth: dataQuality === 'live' ? 'ok' : 'timeout',
      dataQuality,
    },
    _meta: {
      sources: {
        system: 'live',
        metrics: 'live',
        market: dataQuality === 'live' ? 'binance' : 'fallback',
        portfolio: 'live',
        strategies: dataQuality === 'live' ? 'live' : 'fallback',
        risk: 'live',
        aiDecisions: dataQuality === 'live' ? 'live' : 'fallback',
      },
      sourceHealth: {
        binance: dataQuality === 'live' ? 'ok' : 'timeout',
      },
      dataQuality: {
        market: dataQuality,
        strategies: dataQuality,
        aiDecisions: dataQuality,
      },
      errors: dataQuality === 'live' ? [] : ['seed data'],
      fetchTimeMs: 12,
    },
  };
}

async function setupMockRoutes(context, mode) {
  const liveStatus = buildLiveStatus();
  let liveTick = 0;

  await context.route('**/api/live/status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(liveStatus),
    });
  });

  await context.route('**/api/dashboard/summary', (route) => {
    if (mode === 'seed') {
      const summary = buildSummary({
        dataQuality: 'seed',
        prices: [null, null, null],
        changes: [null, null, null],
      });
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summary),
      });
      return;
    }

    liveTick += 1;
    const summary = buildSummary({
      dataQuality: 'live',
      prices: [42150 + liveTick * 5, 2250 + liveTick * 2, 98.5 + liveTick],
      changes: [0.012, -0.005, 0.052],
    });
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summary),
    });
  });
}

async function capture({ filename, v2Enabled, mode, waitMs = 1500, scrollY = 0 }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });

  if (v2Enabled) {
    await context.addInitScript(() => {
      localStorage.setItem('spark.flags.dashboardv2', '1');
    });
  } else {
    await context.addInitScript(() => {
      localStorage.removeItem('spark.flags.dashboardv2');
    });
  }

  if (mode) {
    await setupMockRoutes(context, mode);
  }

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  if (v2Enabled) {
    try {
      await page.waitForSelector('[data-page="dashboard-v2"]', { timeout: 15000 });
    } catch {
      // Allow capture even if selector is not visible yet
    }
  } else {
    try {
      await page.waitForSelector('text=Spark Trading', { timeout: 10000 });
    } catch {
      // Allow capture even if selector is not visible yet
    }
  }

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await sleep(500);
  }

  await page.screenshot({
    path: path.join(OUT_DIR, filename),
  });

  await browser.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await capture({
    filename: '01_v2_off_top.png',
    v2Enabled: false,
    mode: null,
    waitMs: 1500,
    scrollY: 0,
  });

  await capture({
    filename: '02_v2_off_scroll.png',
    v2Enabled: false,
    mode: null,
    waitMs: 1500,
    scrollY: 900,
  });

  await capture({
    filename: '03_v2_on_overview.png',
    v2Enabled: true,
    mode: 'live',
    waitMs: 6500,
    scrollY: 0,
  });

  await capture({
    filename: '04_v2_on_degraded.png',
    v2Enabled: true,
    mode: 'seed',
    waitMs: 1500,
    scrollY: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
