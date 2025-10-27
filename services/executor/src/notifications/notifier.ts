import { URL } from 'node:url';
import client from 'prom-client';

const sent = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Notifications sent',
  labelNames: ['channel']
});

const fail = new client.Counter({
  name: 'notifications_failed_total',
  help: 'Notifications failed',
  labelNames: ['channel', 'reason']
});

const suppressed = new client.Counter({
  name: 'notifications_suppressed_total',
  help: 'Notifications suppressed',
  labelNames: ['channel', 'reason']
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const WEBHOOK_URL = process.env.NOTIFY_WEBHOOK_URL || '';
const ALLOWED_HOSTS = (process.env.NOTIFY_ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
const RATE_LIMIT_PER_MIN = Math.max(parseInt(process.env.NOTIFY_RATE_LIMIT || '20', 10), 1);

let tokens = RATE_LIMIT_PER_MIN;
let lastRefill = Date.now();

function rateOk() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  
  if (elapsed >= 60_000) {
    tokens = RATE_LIMIT_PER_MIN;
    lastRefill = now;
  }
  
  if (tokens <= 0) return false;
  tokens -= 1;
  return true;
}

async function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)) as Promise<T>
  ]);
}

async function tgSend(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    suppressed.inc({ channel: 'telegram', reason: 'disabled' });
    return;
  }
  
  if (!rateOk()) {
    suppressed.inc({ channel: 'telegram', reason: 'ratelimit' });
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  
  try {
    const r = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
    );
    
    if (!r.ok) {
      fail.inc({ channel: 'telegram', reason: String(r.status) });
      return;
    }
    
    sent.inc({ channel: 'telegram' });
  } catch (e: any) {
    fail.inc({ channel: 'telegram', reason: e?.message || 'error' });
  }
}

function validateWebhook(u: string) {
  try {
    const parsed = new URL(u);
    if (ALLOWED_HOSTS.length === 0) return true; // allow all if not configured
    return ALLOWED_HOSTS.includes(parsed.host);
  } catch {
    return false;
  }
}

async function hookSend(payload: any) {
  if (!WEBHOOK_URL) {
    suppressed.inc({ channel: 'webhook', reason: 'disabled' });
    return;
  }
  
  if (!validateWebhook(WEBHOOK_URL)) {
    suppressed.inc({ channel: 'webhook', reason: 'blocked_host' });
    return;
  }
  
  if (!rateOk()) {
    suppressed.inc({ channel: 'webhook', reason: 'ratelimit' });
    return;
  }
  
  try {
    const r = await withTimeout(
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );
    
    if (!r.ok) {
      fail.inc({ channel: 'webhook', reason: String(r.status) });
      return;
    }
    
    sent.inc({ channel: 'webhook' });
  } catch (e: any) {
    fail.inc({ channel: 'webhook', reason: e?.message || 'error' });
  }
}

export type AlertMessage = {
  id: string;
  symbol: string;
  timeframe: string;
  type: string;
  reason: string;
  value?: any;
  ts: number;
};

export function formatText(ev: AlertMessage) {
  const t = new Date(ev.ts).toISOString().replace('T', ' ').slice(0, 19);
  const head = `🔔 <b>${ev.symbol}</b> (${ev.timeframe}) • <i>${ev.type}</i>`;
  const reason = `➡️ ${ev.reason}`;
  const val = ev.value ? `\n<code>${JSON.stringify(ev.value)}</code>` : '';
  return `${head}\n${reason}${val}\n🕒 ${t}`;
}

export async function notify(ev: AlertMessage) {
  // Fire-and-forget parallel (no await)
  tgSend(formatText(ev));
  hookSend({ event: 'alert', data: ev });
}

export async function notifyTest(message = 'Hello from Spark Alerts') {
  await tgSend(message);
  await hookSend({ event: 'test', message });
}

