import { Alert, TriggerEvent, BBBreakParams, FibTouchParams, MacdCrossParams, StochCrossParams } from './types';
import { readAll, countActive } from './store';
import { updateLastTriggered, pushEvent } from './redis';
import pLimit from 'p-limit';
import client from 'prom-client';

const triggeredTotal = new client.Counter({
  name: 'alerts_triggered_total',
  help: 'Total triggered alerts',
  labelNames: ['type', 'symbol', 'timeframe']
});

const errorsTotal = new client.Counter({
  name: 'alerts_errors_total',
  help: 'Alert errors',
  labelNames: ['type']
});

const activeGauge = new client.Gauge({
  name: 'alerts_active',
  help: 'Active alerts'
});

const suppressedTotal = new client.Counter({
  name: 'alerts_suppressed_total',
  help: 'Suppressed alerts',
  labelNames: ['type', 'reason']
});

const COOLDOWN = Math.max(parseInt(process.env.ALERT_COOLDOWN_SEC || '300', 10), 0);
const CONCURRENCY = Math.max(parseInt(process.env.ALERT_EVAL_CONCURRENCY || '5', 10), 1);
const HISTORY_LIMIT = Math.max(parseInt(process.env.ALERT_HISTORY_LIMIT || '100', 10), 1);
const limit = pLimit(CONCURRENCY);

function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

// Helper: Fetch candles (inline copy to avoid circular deps)
async function fetchCandles(symbol: string, timeframe: string, limit: number) {
  const base = process.env.MARKETDATA_URL ?? 'http://localhost:3000/api';
  const url = `${base}/marketdata/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`candles_fetch_failed ${r.status}`);
  return await r.json();
}

async function evaluateCondition(a: Alert): Promise<{ reason: string; value?: any } | null> {
  const { symbol, timeframe, type } = a;
  
  try {
    switch (type) {
      case 'bb_break': {
        const p = a.params as BBBreakParams;
        const period = p.period ?? 20;
        const stdDev = p.stdDev ?? 2;
        
        const candles = await fetchCandles(symbol, timeframe, period + 40);
        const closes = candles.map((c: any) => c.c);
        
        // Simple BB calculation
        const window = closes.slice(-period);
        const m = window.reduce((s: number, v: number) => s + v, 0) / period;
        const variance = window.reduce((s: number, v: number) => s + (v - m) * (v - m), 0) / period;
        const sd = Math.sqrt(variance);
        const u = m + stdDev * sd;
        const l = m - stdDev * sd;
        const c = last(closes);
        
        const hitAbove = c > u;
        const hitBelow = c < l;
        
        if ((p.side === 'above' && hitAbove) || (p.side === 'below' && hitBelow) || (p.side === 'both' && (hitAbove || hitBelow))) {
          return {
            reason: hitAbove ? 'close>upper' : 'close<lower',
            value: { c, u, l }
          };
        }
        return null;
      }
      
      case 'fib_touch': {
        const p = a.params as FibTouchParams;
        const lookback = p.lookback ?? 200;
        const tol = p.tolerance ?? 0.0015;
        
        const candles = await fetchCandles(symbol, timeframe, lookback);
        const highs = candles.map((c: any) => c.h);
        const lows = candles.map((c: any) => c.l);
        const closes = candles.map((c: any) => c.c);
        
        const high = Math.max(...highs);
        const low = Math.min(...lows);
        
        // Calculate Fibonacci levels
        const { FIB } = await import('../../../analytics/src/indicators/ta.js');
        const levels = p.level ? [{ ratio: 'custom', price: p.level }] : FIB(high, low);
        
        const c = last(closes);
        const touched = levels.find((lv: any) => Math.abs(c - lv.price) / lv.price <= tol);
        
        return touched ? {
          reason: `touch ${touched.ratio === 'custom' ? 'custom' : (touched.ratio * 100).toFixed(1) + '%'}`,
          value: { c, level: touched.price, tol }
        } : null;
      }
      
      case 'macd_cross': {
        const p = a.params as MacdCrossParams;
        const fast = p.fast ?? 12;
        const slow = p.slow ?? 26;
        const signal = p.signal ?? 9;
        
        const candles = await fetchCandles(symbol, timeframe, slow + signal + 200);
        const closes = candles.map((c: any) => c.c);
        
        const { MACD } = await import('../../../analytics/src/indicators/ta.js');
        const { macd, signal: sig } = MACD(closes, fast, slow, signal);
        
        const i = macd.length - 1;
        const prev = i - 1;
        
        if (p.mode === 'signal') {
          const crossedUp = macd[prev] <= sig[prev] && macd[i] > sig[i];
          const crossedDn = macd[prev] >= sig[prev] && macd[i] < sig[i];
          
          if ((p.side === 'bullish' && crossedUp) || (p.side === 'bearish' && crossedDn) || (p.side === 'both' && (crossedUp || crossedDn))) {
            return {
              reason: crossedUp ? 'macd↑signal' : 'macd↓signal',
              value: { macd: macd[i], signal: sig[i] }
            };
          }
        } else {
          // zero mode
          const crossedUp = macd[prev] <= 0 && macd[i] > 0;
          const crossedDn = macd[prev] >= 0 && macd[i] < 0;
          
          if ((p.side === 'bullish' && crossedUp) || (p.side === 'bearish' && crossedDn) || (p.side === 'both' && (crossedUp || crossedDn))) {
            return {
              reason: crossedUp ? 'macd↑0' : 'macd↓0',
              value: { macd: macd[i] }
            };
          }
        }
        return null;
      }
      
      case 'stoch_cross': {
        const p = a.params as StochCrossParams;
        const kP = p.kPeriod ?? 14;
        const dP = p.dPeriod ?? 3;
        
        const candles = await fetchCandles(symbol, timeframe, kP + dP + 200);
        const h = candles.map((c: any) => c.h);
        const l = candles.map((c: any) => c.l);
        const c = candles.map((c: any) => c.c);
        
        const { STOCH } = await import('../../../analytics/src/indicators/ta.js');
        const { k, d } = STOCH(h, l, c, kP, dP);
        
        const i = k.length - 1;
        const prev = i - 1;
        const kNow = k[i];
        const dNow = d[i];
        
        const crossUp = k[prev] <= d[prev] && kNow > dNow;
        const crossDn = k[prev] >= d[prev] && kNow < dNow;
        const ob = kNow > 80;
        const os = kNow < 20;
        
        if (p.side === 'k_cross_d' && (crossUp || crossDn)) {
          return {
            reason: crossUp ? 'k↑d' : 'k↓d',
            value: { k: kNow, d: dNow }
          };
        }
        
        if (p.side === 'overbought' && ob) {
          return {
            reason: 'stoch>80',
            value: { k: kNow }
          };
        }
        
        if (p.side === 'oversold' && os) {
          return {
            reason: 'stoch<20',
            value: { k: kNow }
          };
        }
        
        if (p.side === 'all' && (crossUp || crossDn || ob || os)) {
          return {
            reason: crossUp ? 'k↑d' : crossDn ? 'k↓d' : ob ? 'stoch>80' : 'stoch<20',
            value: { k: kNow, d: dNow }
          };
        }
        
        return null;
      }
      
      default:
        return null;
    }
  } catch (e: any) {
    errorsTotal.inc({ type });
    return null;
  }
}

async function evaluateOne(a: Alert): Promise<TriggerEvent | null> {
  const { id, symbol, timeframe, type } = a;
  
  try {
    // Cooldown check
    const now = Date.now();
    const last = Number(a.lastTriggeredAt || 0);
    
    if (COOLDOWN > 0 && last && (now - last) < COOLDOWN * 1000) {
      suppressedTotal.inc({ type, reason: 'cooldown' });
      return null;
    }
    
    // Evaluate condition
    const result = await evaluateCondition(a);
    if (!result) return null;
    
    // Create event
    const ev: TriggerEvent = {
      id,
      symbol,
      timeframe,
      type,
      reason: result.reason,
      value: result.value,
      ts: now
    };
    
    // Persist history + update lastTriggered
    await pushEvent(id, ev, HISTORY_LIMIT);
    await updateLastTriggered(id, now);
    
    // Send notification
    const { notify } = await import('../notifications/notifier.js');
    notify(ev as any);
    
    // Metrics
    triggeredTotal.inc({ type, symbol, timeframe });
    
    return ev;
  } catch (e: any) {
    errorsTotal.inc({ type });
    return null;
  }
}

export async function pollOnce(): Promise<TriggerEvent[]> {
  const activeCount = await countActive();
  activeGauge.set(activeCount);
  
  const all = (await readAll()).filter(a => a.active);
  
  // Parallel evaluation with concurrency limit
  const results = await Promise.allSettled(
    all.map(a => limit(() => evaluateOne(a)))
  );
  
  const events: TriggerEvent[] = results
    .filter((r): r is PromiseFulfilledResult<TriggerEvent | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((ev): ev is TriggerEvent => ev !== null);
  
  return events;
}

const leaderElectedTotal = new client.Counter({
  name: 'leader_elected_total',
  help: 'Leader elections'
});

const leaderHeldSeconds = new client.Counter({
  name: 'leader_held_seconds',
  help: 'Leader held seconds'
});

let timer: NodeJS.Timeout | null = null;

export async function startScheduler(intervalMs = 30_000) {
  if (String(process.env.SCHEDULER_ENABLED ?? 'true') !== 'true') {
    console.log('[alerts] scheduler disabled');
    return;
  }
  
  if (timer) return;
  
  console.log('[alerts] scheduler candidate starting...');
  
  let isLeader = false;
  let held = 0;
  
  const { tryAcquire, heartbeat } = await import('./leader.js');
  
  timer = setInterval(async () => {
    try {
      if (!isLeader) {
        isLeader = await tryAcquire();
        if (isLeader) {
          leaderElectedTotal.inc();
          console.log('[alerts] became leader');
        } else {
          return; // Not leader, skip
        }
      } else {
        await heartbeat();
        held += intervalMs / 1000;
        if (held >= 30) {
          leaderHeldSeconds.inc(held);
          held = 0;
        }
      }
      
      const evs = await pollOnce();
      if (evs.length) {
        console.log('[alerts] triggered', evs.map(e => ({ id: e.id, type: e.type, reason: e.reason })));
      }
    } catch (e) {
      console.error('[alerts] scheduler error', e);
      isLeader = false; // Lose leadership on error
    }
  }, intervalMs);
  
  console.log(`[alerts] scheduler started (${intervalMs}ms interval, cooldown=${COOLDOWN}s, concurrency=${CONCURRENCY})`);
}

export function stopScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[alerts] scheduler stopped');
  }
}

