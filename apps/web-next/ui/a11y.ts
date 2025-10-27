'use client';
/**
 * A11y helpers centralized for badges/health/kpi.
 * Turkish aria metinleri; görsel davranışa dokunmaz.
 */
export type UITone = 'ok' | 'warn' | 'down' | 'loading';
export type ExchangeKey = 'auto' | 'binance' | 'btcturk';

const TONE_TR: Record<UITone, string> = {
  ok: 'sağlıklı',
  warn: 'uyarı',
  down: 'kapalı',
  loading: 'yükleniyor',
};

const EX_TR: Record<ExchangeKey, string> = {
  auto: 'Otomatik borsa seçimi',
  binance: 'Binance seçili',
  btcturk: 'BTCTurk seçili',
};

export function toneAriaLabel(tone: UITone, prefix = 'Sistem durumu'): string {
  return `${prefix}: ${TONE_TR[tone]}`;
}

export function exchangeAriaLabel(ex: ExchangeKey, prefix = 'Borsa'): string {
  return `${prefix}: ${EX_TR[ex]}`;
}

export function formatMs(ms?: number | null) {
  if (!Number.isFinite(ms as number)) return '—';
  return `${Math.round(ms as number)}ms`;
} 