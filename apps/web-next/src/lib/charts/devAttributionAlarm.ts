/**
 * Dev-only runtime alarm: TradingView attribution link tespiti
 *
 * Hedef: Kütüphane güncellenir, bir yerde ayar kaçarsa... ilk açan kişi console'da tek bir WARN görsün.
 * Prod'da tamamen kapalı.
 *
 * DOM'u değiştirmez (silmez/yamalamaz), sadece uyarı verir.
 * E2E zaten yakalıyor; bu "gözle ilk yakalama" güvenliği.
 */

let warned = false;

export function devAttributionAlarm(
  root: HTMLElement,
  context?: Record<string, unknown>
) {
  if (process.env.NODE_ENV === 'production') return;
  if (typeof window === 'undefined') return;
  if (warned) return;

  const hasAttribution = () =>
    !!root.querySelector('a[href*="tradingview.com"], a[href*="tradingview"]');

  const warnOnce = () => {
    if (warned) return;
    warned = true;
    // DOM'u silme/yamama yok -> sadece alarm
    // (E2E zaten yakalıyor; bu "gözle ilk yakalama" güvenliği)
    // eslint-disable-next-line no-console
    console.warn('[spark][chart] TradingView attribution bulundu!', {
      ...context,
      sample: root.querySelector('a[href*="tradingview"]')?.getAttribute('href'),
    });
  };

  if (hasAttribution()) return warnOnce();

  const mo = new MutationObserver(() => {
    if (hasAttribution()) {
      warnOnce();
      mo.disconnect();
    }
  });

  mo.observe(root, { childList: true, subtree: true });

  // leak riskini sıfırlamak için otomatik kapanış (alarm yakalanmazsa bile)
  window.setTimeout(() => mo.disconnect(), 10_000);
}

