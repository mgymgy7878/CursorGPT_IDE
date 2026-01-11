import { expect, test, Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const evidenceDir = join(process.cwd(), 'evidence');
const paths = {
  wheelBefore: join(evidenceDir, 'wheel-before.png'),
  wheelAfter: join(evidenceDir, 'wheel-after.png'),
  rsiAfter: join(evidenceDir, 'rsi-after.png'),
  wheelRange: join(evidenceDir, 'wheel-range.json'),
  rsiValues: join(evidenceDir, 'rsi-values.json'),
  log: join(evidenceDir, 'ui-wheel.log'),
};

type HudSnapshot = {
  range: { from: number; to: number };
  rsi: number | null;
  tickCount: number;
  scrollY: number;
  deltaY: number;
  ts: number;
};

const waitForHudSnapshot = async (page: Page): Promise<HudSnapshot> => {
  const handle = await page.waitForFunction(() => {
    const api = (window as any).__sparkWheelEvidence;
    const hud = api?.getHud?.();
    const range = api?.getRange?.();
    if (!api || !hud || !range) return null;

    return {
      range,
      rsi: hud.rsiLastValue ?? null,
      tickCount: hud.tickCount ?? 0,
      scrollY: api.getScrollY?.() ?? window.scrollY,
      deltaY: hud.lastDeltaY ?? 0,
      ts: hud.lastUpdate ?? Date.now(),
    };
  }, { timeout: 15000 });

  return (await handle.jsonValue()) as HudSnapshot;
};

test.describe('Wheel Zoom + RSI Evidence', () => {
  test.beforeAll(() => {
    mkdirSync(evidenceDir, { recursive: true });
  });

  test('deterministik wheel zoom ve RSI kanıtı üretir', async ({ page }) => {
    const symbol = process.env.E2E_SYMBOL || 'BTC/USDT';
    const timeframe = process.env.E2E_TF || '1D';
    const search = new URLSearchParams({
      symbol,
      view: 'workspace',
      tf: timeframe,
    }).toString();

    const logs: Array<{ type: string; text: string; timestamp: string }> = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[WHEEL_EVIDENCE]') || text.includes('[RSI_UPDATE_EVIDENCE]') || text.includes('Unable to preventDefault')) {
        logs.push({
          type: msg.type(),
          text,
          timestamp: new Date().toISOString(),
        });
      }
    });

    await page.goto(`/market-data?${search}`);
    await page.waitForLoadState('networkidle');

    const chartContainer = page.locator('[data-testid="mkt-chart"]').first();
    await expect(chartContainer).toBeVisible({ timeout: 15000 });

    const initialHud = await waitForHudSnapshot(page);
    const rangeBefore = initialHud.range;
    const rsiBefore = initialHud.rsi;
    const scrollYBefore = initialHud.scrollY;

    await page.screenshot({ path: paths.wheelBefore, fullPage: true });

    const wheelResult = await page.evaluate(() => {
      const api = (window as any).__sparkWheelEvidence;
      if (!api?.dispatchWheel) return null;
      return api.dispatchWheel({ deltaY: -180, ratioX: 0.45, ratioY: 0.55 });
    });

    expect(wheelResult).toBeTruthy();
    expect(wheelResult?.defaultPrevented).toBeTruthy();

    await page.waitForTimeout(300);
    const hudAfterWheel = await waitForHudSnapshot(page);
    const scrollYAfter = hudAfterWheel.scrollY;

    await page.screenshot({ path: paths.wheelAfter, fullPage: true });

    const forcedRsi = await page.evaluate(() => {
      const api = (window as any).__sparkWheelEvidence;
      if (!api?.forceRsiTick) return null;
      return api.forceRsiTick();
    });
    expect(forcedRsi).toBeTruthy();

    const rsiAfterHandle = await page.waitForFunction(
      (baselineRsi) => {
        const api = (window as any).__sparkWheelEvidence;
        const hud = api?.getHud?.();
        if (!hud) return null;
        if (hud.rsiLastValue == null) return null;
        return hud.rsiLastValue !== baselineRsi
          ? { rsi: hud.rsiLastValue, tickCount: hud.tickCount }
          : null;
      },
      { timeout: 8000 },
      rsiBefore,
    );
    const rsiAfterHud = await rsiAfterHandle.jsonValue() as { rsi: number; tickCount: number };

    await page.screenshot({ path: paths.rsiAfter, fullPage: true });

    const finalHud = await waitForHudSnapshot(page);

    const effectiveRangeAfter = hudAfterWheel.range;
    const rangeChanged = Math.abs(effectiveRangeAfter.from - rangeBefore.from) + Math.abs(effectiveRangeAfter.to - rangeBefore.to) > 0.01;
    const scrollStable = scrollYAfter === scrollYBefore;
    const rsiChanged = rsiBefore === null ? true : rsiAfterHud.rsi !== rsiBefore;

    const wheelRange = {
      timestamp: new Date().toISOString(),
      rangeBefore,
      rangeAfter: effectiveRangeAfter,
      rangeBeforeDispatch: wheelResult?.rangeBefore ?? null,
      rangeAfterDispatch: wheelResult?.rangeAfter ?? null,
      rangeChanged,
      deltaY: wheelResult?.deltaY ?? null,
      defaultPrevented: wheelResult?.defaultPrevented ?? false,
      scrollYBefore,
      scrollYAfter,
      hudDeltaY: hudAfterWheel.deltaY,
    };

    const rsiValues = {
      timestamp: new Date().toISOString(),
      rsiBefore,
      rsiAfter: rsiAfterHud.rsi,
      tickCount: rsiAfterHud.tickCount,
      hudTickCount: finalHud.tickCount,
      hudDeltaY: finalHud.deltaY,
    };

    writeFileSync(paths.wheelRange, JSON.stringify(wheelRange, null, 2), 'utf-8');
    writeFileSync(paths.rsiValues, JSON.stringify(rsiValues, null, 2), 'utf-8');

    const logBody = [
      '# Wheel Zoom + RSI Evidence',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Wheel',
      `Range Before: ${JSON.stringify(rangeBefore)}`,
      `Range After: ${JSON.stringify(effectiveRangeAfter)}`,
      `Range Before (Dispatch): ${JSON.stringify(wheelResult?.rangeBefore ?? null)}`,
      `Range After (Dispatch): ${JSON.stringify(wheelResult?.rangeAfter ?? null)}`,
      `Range Changed: ${rangeChanged}`,
      `ScrollY Before: ${scrollYBefore}`,
      `ScrollY After: ${scrollYAfter}`,
      `Default Prevented: ${wheelResult?.defaultPrevented}`,
      '',
      '## RSI',
      `RSI Before: ${rsiBefore}`,
      `RSI After: ${rsiAfterHud.rsi}`,
      `Tick Count: ${rsiAfterHud.tickCount}`,
      '',
      `Console Logs (${logs.length})`,
      ...logs.map((log, idx) => `#${idx + 1} [${log.timestamp}] (${log.type}) ${log.text}`),
    ].join('\n');

    writeFileSync(paths.log, logBody, 'utf-8');

    expect(rangeChanged).toBeTruthy();
    expect(scrollStable).toBeTruthy();
    expect(rsiChanged).toBeTruthy();
    expect(rsiAfterHud.tickCount).toBeGreaterThan(0);
  });
});
