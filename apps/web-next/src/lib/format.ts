/**
 * Locale-aware formatting utilities
 * Provides consistent number, currency, duration, and percentage formatting
 */

/** Internal: sembol/undefined -> ISO 4217 (3 harf). Asla throw etmez. */
function toIsoCurrency(currency: string | null | undefined): string {
  if (currency === null || currency === undefined) return "USD";
  const s = String(currency).trim();
  if (s === "" || s === "$") return "USD";
  if (s === "₺" || s === "TL" || s.toUpperCase() === "TRY") return "TRY";
  const code = s.toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

/**
 * Internal: value -> number veya null (string/bigint/Decimal sürprizleri için).
 * UI'da format fonksiyonlarına gelen API değerleri bazen string olabiliyor; asla throw etmeyelim.
 */
function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "bigint") return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const formatCurrency = (
  v: number | string | null | undefined,
  locale = "tr-TR",
  currency = "USD"
) => {
  const n = coerceNumber(v);
  if (n === null) return "—";
  const iso = toIsoCurrency(currency);
  try {
    const raw = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: iso,
      currencyDisplay: "symbol",
      maximumFractionDigits: 2,
    })
      .format(n)
      .replace(/\u00A0/g, "\u202F"); // NBSP → NNBSP (narrow no-break space)

    // TR locale: move $ to end
    if (locale.startsWith("tr") && /^\$/.test(raw)) {
      const num = raw.replace(/^\$/, "").trim();
      return `${num}\u202F$`; // Narrow no-break space before $
    }

    return raw;
  } catch {
    return `${n.toFixed(2)} ${iso}`;
  }
};

export const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  return `${s} sn`;
};

export const formatMs = (ms: number) => `${ms} ms`;
export const formatSec = (s: number) => `${s} sn`;

export const formatPercent = (p: number, locale = "tr-TR") =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(p);

/**
 * changePct normalizasyonu: farklı kaynaklar fraction (0.0123) veya yüzde puan (1.23) dönebilir.
 * Tek kapı: UiTicker.changePct her zaman yüzde puan (1.23 = %1.23).
 */
export function normalizeChangePct(
  value: number | null | undefined,
  options: { from: "fraction" | "percentage" } = { from: "percentage" }
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value))
    return null;
  if (options.from === "fraction") return value * 100;
  return value;
}

/**
 * Format percentage — input = percentage points (yüzde puan).
 * Kural: changePct her yerde yüzde puan; +1.23 = %1.23. Ekstra *100 yapılmaz.
 * Example: 1.23 → "+1.23%", -0.5 → "-0.50%"
 */
export const formatPct = (
  value: number | null | undefined,
  options: { decimals?: number; showSign?: boolean; locale?: string } = {}
): string => {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const { decimals = 2, showSign = true } = options;
  const sign = value >= 0 ? (showSign ? "+" : "") : "-";
  const absValue = Math.abs(value);
  return `${sign}${absValue.toFixed(decimals)}%`;
};

/**
 * Format symbol: BTCUSDT → BTC/USDT
 */
export const formatSymbol = (symbol: string): string => {
  if (symbol.includes("USDT")) {
    return symbol.replace("USDT", "/USDT");
  }
  // Other pairs: ETHBTC → ETH/BTC
  if (symbol.length >= 6) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    return `${base}/${quote}`;
  }
  return symbol;
};

/**
 * Replace empty/null/undefined values with user-friendly text
 */
export const emptyText = (v: unknown, fallback = "Henüz veri yok.") =>
  v === null || v === undefined || v === "—" || v === "" ? fallback : String(v);

/**
 * formatNumber - Güvenli number formatting (null/undefined => "—")
 * UI'da "format" asla ham x.toLocaleString() ile yapılmayacak.
 * Locale: supportedLocalesOf ile desteklenmiyorsa en-US fallback (SSR/test/CI deterministik).
 */
export function formatNumber(
  value: number | null | undefined,
  localeOrOptions:
    | string
    | {
        locale?: string;
        maximumFractionDigits?: number;
        minimumFractionDigits?: number;
      } = {}
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const options =
    typeof localeOrOptions === "string"
      ? { locale: localeOrOptions }
      : localeOrOptions;
  const desired = options.locale ?? "en-US";
  const supported = Intl.NumberFormat.supportedLocalesOf([desired]).length > 0;
  const effective = supported ? desired : "en-US";
  const { maximumFractionDigits = 2, minimumFractionDigits } = options;
  return new Intl.NumberFormat(effective, {
    maximumFractionDigits,
    ...(minimumFractionDigits !== undefined && { minimumFractionDigits }),
  }).format(value);
}

/**
 * normalizeCurrency - Currency input'u ISO 4217 koduna normalize eder
 * String, object ({code, currency, symbol}), null, undefined hepsini tolere eder
 * Kural: Para birimi formatı tek yerden (format.ts); başka yerde currency ile oynamayın.
 */
type CurrencyLike =
  | string
  | { code?: string; currency?: string; symbol?: string }
  | null
  | undefined;

function normalizeCurrency(input: CurrencyLike, fallback = "USD"): string {
  // String ise önce sembol -> ISO (Intl RangeError önlemi)
  if (typeof input === "string") {
    const s = input.trim();
    if (s === "" || s === "$") return "USD";
    if (s === "₺" || s === "TL") return "TRY";
    const code = s.toUpperCase();
    // ISO 4217 "3 harf" kontrolü (USD, TRY, EUR...)
    if (/^[A-Z]{3}$/.test(code)) {
      // Destek varsa "gerçekten bilinen currency mi?" kontrolü
      try {
        // @ts-ignore - Intl.supportedValuesOf bazı ortamlarda yok
        if (typeof Intl.supportedValuesOf === "function") {
          // @ts-ignore
          const supported = Intl.supportedValuesOf("currency") as string[];
          if (supported.includes(code)) return code;
        }
      } catch {
        // Intl.supportedValuesOf yoksa veya hata varsa code'u kabul et
      }
      return code;
    }
    return fallback;
  }

  // Object ise code veya currency alanından al
  if (input && typeof input === "object") {
    const raw = input.code || input.currency || "";
    if (typeof raw === "string") {
      const code = raw.toUpperCase().trim();
      if (/^[A-Z]{3}$/.test(code)) return code;
    }
  }

  return fallback;
}

/**
 * formatMoney - Güvenli money formatting (null/undefined => "—")
 *
 * Varsayılan locale: tr-TR (P0 locale tutarlılığı). Sembol konumu Intl'e göre
 * (TR'de bazen "48.050,00 $" gibi sonda olabilir). Her zaman başta $ istiyorsanız:
 * "$" + formatNumber(value, { locale: "tr-TR", maximumFractionDigits: 2 })
 *
 * Overload signatures for better type safety:
 * - formatMoney(value)
 * - formatMoney(value, currency)
 * - formatMoney(value, currency, locale)
 * - formatMoney(value, currency, locale, options)
 * - formatMoney(value, options) - Legacy support (yanlış kullanım ama tolere edilir)
 *
 * @param value - Formatlanacak sayı
 * @param currencyOrOptions - Currency kodu (string) veya options object (legacy support)
 * @param localeOrOptions - Locale string veya options object
 * @param options - Formatlama seçenekleri
 */
export function formatMoney(
  value: number | string | null | undefined,
  currencyOrOptions?:
    | CurrencyLike
    | { maximumFractionDigits?: number; locale?: string },
  localeOrOptions?: string | { maximumFractionDigits?: number },
  options?: { maximumFractionDigits?: number; locale?: string }
): string {
  const n = coerceNumber(value);
  if (n === null) return "—";

  // Backward compatibility: Eğer 2. parametre options object ise (legacy kullanım)
  let currency: CurrencyLike = "USD";
  let locale = "tr-TR"; // P0 locale: Dashboard + tüm $ değerleri tek kültür (TR)
  let maxFractionDigits = 2;

  if (typeof currencyOrOptions === "object" && currencyOrOptions !== null) {
    // 2. parametre options object ise (yanlış kullanım ama tolere edelim)
    if (
      "maximumFractionDigits" in currencyOrOptions ||
      "locale" in currencyOrOptions
    ) {
      maxFractionDigits = currencyOrOptions.maximumFractionDigits ?? 2;
      locale = currencyOrOptions.locale ?? "tr-TR";
      currency = "USD"; // Default currency
    } else {
      // Currency object ise ({code, currency, symbol})
      currency = currencyOrOptions as CurrencyLike;
    }
  } else if (currencyOrOptions !== undefined) {
    // 2. parametre string (currency) veya CurrencyLike
    currency = currencyOrOptions;
  }

  // 3. parametre locale string ise
  if (typeof localeOrOptions === "string") {
    locale = localeOrOptions;
  } else if (localeOrOptions && typeof localeOrOptions === "object") {
    // 3. parametre options object ise
    maxFractionDigits =
      localeOrOptions.maximumFractionDigits ?? maxFractionDigits;
  }

  // 4. parametre options ise
  if (options) {
    maxFractionDigits = options.maximumFractionDigits ?? maxFractionDigits;
    locale = options.locale ?? locale;
  }

  // Currency'yi normalize et
  const normalizedCurrency = normalizeCurrency(currency, "USD");

  try {
    return n.toLocaleString(locale, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: maxFractionDigits,
    });
  } catch {
    // Son çare: patlamasın
    return `${n.toFixed(maxFractionDigits)} ${normalizedCurrency}`;
  }
}

/**
 * formatMoneyIso - Para sembolü politikası A: ISO kodu (USD 48.050,00)
 * Sembolün sağda/solda tartışmasını bitirir; çoklu piyasa için net.
 * Bkz. docs/UI_UX_PLAN.md §5 Para sembolü politikası.
 * Asla throw etmez: geçersiz currency -> ISO fallback; hata -> "—" veya güvenli string.
 */
export function formatMoneyIso(
  value: number | string | null | undefined,
  currency: string = "USD",
  options: {
    locale?: string;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {}
): string {
  const n = coerceNumber(value);
  if (n === null) return "—";
  const code = toIsoCurrency(currency);
  try {
    const {
      locale = "tr-TR",
      maximumFractionDigits = 2,
      minimumFractionDigits = 2,
    } = options;
    const num = formatNumber(n, {
      locale,
      maximumFractionDigits,
      minimumFractionDigits,
    });
    return `${code} ${num}`;
  } catch {
    return `${n.toFixed(2)} ${code}`;
  }
}

/**
 * formatDateTime - Güvenli date/time formatting (null/undefined => "—")
 */
export function formatDateTime(
  value: number | Date | null | undefined,
  locale: string = "tr-TR"
): string {
  if (value === null || value === undefined) {
    return "—";
  }
  try {
    const date = typeof value === "number" ? new Date(value) : value;
    if (isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString(locale);
  } catch {
    return "—";
  }
}

/**
 * parseCompactUsd - "$812K", "$1.2M", "$3.5B" formatlarını number'a çevir
 * @param v - String veya number
 * @returns number | null
 */
export function parseCompactUsd(v: unknown): number | null {
  // Number ise direkt dön
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }

  // String değilse null
  if (typeof v !== "string") {
    return null;
  }

  // "$812K" / "$1.2M" formatını parse et
  const s = v.trim().replace(/\$/g, "").replace(/,/g, "");
  const m = s.match(/^(\d+(\.\d+)?)([KMB])?$/i);
  if (!m) {
    return null;
  }

  const n = Number(m[1]);
  if (!Number.isFinite(n)) {
    return null;
  }

  const mult =
    m[3]?.toUpperCase() === "K"
      ? 1e3
      : m[3]?.toUpperCase() === "M"
        ? 1e6
        : m[3]?.toUpperCase() === "B"
          ? 1e9
          : 1;

  return n * mult;
}

/**
 * formatPrice - Tick size'a göre tutarlı fiyat formatlama
 * Binance BTCUSDT tick size: 0.01 (2 decimal)
 * Binance ETHUSDT tick size: 0.01 (2 decimal)
 *
 * @param symbol - Trading pair (BTCUSDT, ETHUSDT, etc.)
 * @param price - Fiyat değeri
 * @param options - Formatlama seçenekleri
 * @returns Formatlanmış fiyat string
 */
export function formatPrice(
  symbol: string,
  price: number | string | null | undefined,
  options: { locale?: string; showCurrency?: boolean } = {}
): string {
  const p = coerceNumber(price);
  if (p === null) return "—";

  // Tick size mapping (Binance standartları)
  const tickSizeMap: Record<string, number> = {
    BTCUSDT: 0.01,
    ETHUSDT: 0.01,
    BNBUSDT: 0.01,
    // Varsayılan: 2 decimal
  };

  const tickSize = tickSizeMap[symbol.toUpperCase()] || 0.01;
  const decimals = Math.max(0, -Math.log10(tickSize));
  const rounded = Math.round(p / tickSize) * tickSize;

  const { locale = "tr-TR", showCurrency = false } = options;

  if (showCurrency) {
    return rounded.toLocaleString(locale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return rounded.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
