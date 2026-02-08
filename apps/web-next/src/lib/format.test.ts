/**
 * Format helpers test suite
 * V1.3-P3: Full coverage for formatCurrency, formatNumber
 * PATCH: Null/undefined safety tests added (crash-proof)
 */

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDuration,
  formatMoney,
  formatMoneyIso,
  formatDateTime,
  formatPct,
  normalizeChangePct,
} from "./format";

describe("formatCurrency", () => {
  test("formats positive numbers with TR locale", () => {
    const result = formatCurrency(42500, "tr-TR", "USD");
    expect(result).toContain("42.500");
    expect(result).toContain("$");
  });

  test("formats negative numbers", () => {
    const result = formatCurrency(-1234.56, "tr-TR", "USD");
    expect(result).toContain("-");
    expect(result).toContain("1.234");
  });

  test("formats zero", () => {
    const result = formatCurrency(0, "tr-TR", "USD");
    expect(result).toContain("0");
  });

  test("handles very large numbers", () => {
    const result = formatCurrency(123456789.12, "tr-TR", "USD");
    expect(result).toContain("123.456.789");
  });

  test("formats with EN locale", () => {
    const result = formatCurrency(42500, "en-US", "USD");
    expect(result).toContain("42,500");
  });

  test("handles fractional amounts", () => {
    const result = formatCurrency(1234.567, "tr-TR", "USD");
    // Should round to 2 decimal places
    expect(result).toMatch(/1\.234,5[67]/);
  });
});

describe("formatNumber", () => {
  test("formats numbers with TR locale", () => {
    const result = formatNumber(1234.56, "tr-TR");
    expect(result).toBe("1.234,56");
  });

  test("formats numbers with EN locale", () => {
    const result = formatNumber(1234.56, "en-US");
    expect(result).toBe("1,234.56");
  });

  test("handles zero", () => {
    const result = formatNumber(0, "tr-TR");
    expect(result).toBe("0");
  });

  test("handles negative numbers", () => {
    const result = formatNumber(-9876.54, "tr-TR");
    expect(result).toContain("-9.876");
  });

  test("handles very large numbers", () => {
    const result = formatNumber(123456789.123, "en-US");
    expect(result).toBe("123,456,789.12");
  });
});

describe("formatPercent", () => {
  test("formats percentage with TR locale", () => {
    const result = formatPercent(0.456, "tr-TR");
    expect(result).toContain("45");
    expect(result).toContain("%");
  });

  test("formats small percentages", () => {
    const result = formatPercent(0.001, "tr-TR");
    expect(result).toContain("0");
  });
});

describe("formatDuration", () => {
  test("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500 ms");
  });

  test("formats seconds", () => {
    expect(formatDuration(2500)).toBe("3 sn");
  });

  test("handles zero", () => {
    expect(formatDuration(0)).toBe("0 ms");
  });
});

describe("formatNumber - null/undefined safety", () => {
  test("null -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatNumber(null)).toBe("—");
  });

  test("undefined -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatNumber(undefined)).toBe("—");
  });

  test("NaN -> em dash", () => {
    expect(formatNumber(NaN)).toBe("—");
  });

  test("Infinity -> em dash", () => {
    expect(formatNumber(Infinity)).toBe("—");
  });

  test("valid number formats correctly", () => {
    expect(formatNumber(1234.56, { locale: "tr-TR" })).toContain("1.234");
  });
});

describe("formatMoney - null/undefined safety", () => {
  test("null -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatMoney(null)).toBe("—");
  });

  test("undefined -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatMoney(undefined)).toBe("—");
  });

  test("NaN -> em dash", () => {
    expect(formatMoney(NaN)).toBe("—");
  });

  test("valid number formats correctly", () => {
    const result = formatMoney(1234.56, "USD", "en-US");
    expect(result).toContain("1,234.56");
    expect(result).toContain("$");
  });
});

describe("formatMoney - default locale tr-TR (P0 locale evidence)", () => {
  test("default locale tr-TR: 48050 → 48.050,00 pattern (TR grouping + comma decimal)", () => {
    const result = formatMoney(48050);
    expect(result).toMatch(/48\.050,00/);
    expect(result).toContain("$");
  });

  test("negative value -9876.54 in TR format: -9.876,54 (sembol başta veya sonda)", () => {
    const result = formatMoney(-9876.54);
    expect(result).toMatch(/9\.876,54/);
    expect(result).toContain("-");
    expect(result).toContain("$");
  });

  test("object currency -> normalized to USD (default locale tr-TR)", () => {
    // Runtime guard: object currency tolere edilir; default locale tr-TR
    // @ts-expect-error - Testing runtime safety (object currency)
    const result = formatMoney(1234.56, { code: "USD" });
    expect(result).toMatch(/1\.234,56/);
    expect(result).toContain("$");
  });

  test("invalid currency object -> falls back to USD (default locale tr-TR)", () => {
    // @ts-expect-error - Testing runtime safety (invalid object)
    const result = formatMoney(1234.56, { invalid: "XXX" });
    expect(result).toMatch(/1\.234,56/);
    expect(result).toContain("$");
  });

  test("legacy options object as 2nd param -> tolere edilir (default locale tr-TR)", () => {
    // Yanlış kullanım ama tolere edilir; default locale tr-TR
    // @ts-expect-error - Testing legacy usage
    const result = formatMoney(1234.56, { maximumFractionDigits: 2 });
    expect(result).toMatch(/1\.234,56/);
    expect(result).toContain("$");
  });
});

describe("formatDateTime - null/undefined safety", () => {
  test("null -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatDateTime(null)).toBe("—");
  });

  test("undefined -> em dash", () => {
    // @ts-expect-error - Testing runtime safety
    expect(formatDateTime(undefined)).toBe("—");
  });

  test("invalid date -> em dash", () => {
    expect(formatDateTime(new Date("invalid"))).toBe("—");
  });

  test("valid date formats correctly", () => {
    const date = new Date("2024-01-15T10:30:00");
    const result = formatDateTime(date, "tr-TR");
    expect(result).toBeTruthy();
    expect(result).not.toBe("—");
  });

  test("timestamp number formats correctly", () => {
    const timestamp = Date.now();
    const result = formatDateTime(timestamp, "tr-TR");
    expect(result).toBeTruthy();
    expect(result).not.toBe("—");
  });
});

describe("formatPct (percentage points)", () => {
  test("input = percentage points: 1.23 => +1.23%", () => {
    const result = formatPct(1.23);
    expect(result).toBe("+1.23%");
  });

  test("negative: -0.5 => -0.50%", () => {
    const result = formatPct(-0.5);
    expect(result).toBe("-0.50%");
  });

  test("no double *100: 120 => +120.00% (Binance-style raw)", () => {
    const result = formatPct(120);
    expect(result).toBe("+120.00%");
  });

  test("null/undefined => —", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPct(undefined)).toBe("—");
  });
});

describe("normalizeChangePct", () => {
  test("from percentage: 1.23 => 1.23", () => {
    expect(normalizeChangePct(1.23, { from: "percentage" })).toBe(1.23);
  });

  test("from fraction: 0.0123 => 1.23", () => {
    expect(normalizeChangePct(0.0123, { from: "fraction" })).toBe(1.23);
  });
});

describe("formatMoneyIso - para sembolü politikası A (ISO kodu)", () => {
  test("USD 48.050,00 pattern (TR locale)", () => {
    const result = formatMoneyIso(48050, "USD");
    expect(result).toMatch(/^USD 48\.050,00$/);
  });

  test("null/undefined => —", () => {
    expect(formatMoneyIso(null)).toBe("—");
    expect(formatMoneyIso(undefined)).toBe("—");
  });

  test("TRY currency code", () => {
    const result = formatMoneyIso(1000.5, "TRY");
    expect(result).toMatch(/^TRY .+$/);
    expect(result).toContain("1.000");
  });
});

/**
 * Para formatı throw-safe (500 önlemi): Intl’e geçersiz currency gitmesin.
 * Sembol → ISO normalizasyonu + null/NaN → "—" sözleşmesi.
 */
describe("formatMoneyIso & formatCurrency - throw-safe (500 önlemi)", () => {
  test('currency "$" → USD (sembol normalizasyonu)', () => {
    const result = formatMoneyIso(1234.56, "$");
    expect(result).toMatch(/^USD .+$/);
    expect(result).toContain("1.234");
  });

  test('currency "₺" / "TL" → TRY', () => {
    expect(formatMoneyIso(100, "₺")).toMatch(/^TRY .+$/);
    expect(formatMoneyIso(100, "TL")).toMatch(/^TRY .+$/);
  });

  test('invalid/empty currency → USD fallback (asla throw etmez)', () => {
    expect(formatMoneyIso(99, "")).toMatch(/^USD .+$/);
    // @ts-expect-error - runtime guard
    expect(formatMoneyIso(99, undefined)).toMatch(/^USD .+$/);
    expect(formatMoneyIso(99, "INVALID")).toMatch(/^USD .+$/);
  });

  test('value NaN/null/undefined → "—" (asla throw etmez)', () => {
    expect(formatMoneyIso(NaN, "USD")).toBe("—");
    expect(formatMoneyIso(null, "USD")).toBe("—");
    expect(formatMoneyIso(undefined, "USD")).toBe("—");
  });

  test('formatCurrency with "$" or invalid → safe string (no RangeError)', () => {
    expect(() => formatCurrency(100, "tr-TR", "$")).not.toThrow();
    expect(formatCurrency(100, "tr-TR", "$")).toMatch(/100|1\.?0\.?0/);
    expect(() => formatCurrency(100, "tr-TR", "₺")).not.toThrow();
    expect(() => formatCurrency(100, "tr-TR", "")).not.toThrow();
  });
});

describe("formatMoneyIso & formatCurrency - string/bigint coerce (market-data API safety)", () => {
  test('formatMoneyIso("123.45", "USD") → güvenli formatlanmış string', () => {
    const result = formatMoneyIso("123.45", "USD");
    expect(result).toMatch(/^USD .+$/);
    expect(result).toContain("123");
    expect(result).not.toBe("—");
  });

  test('formatMoneyIso("abc", "USD") → "—" (geçersiz sayı)', () => {
    expect(formatMoneyIso("abc", "USD")).toBe("—");
  });

  test('formatCurrency string "65116.01" → güvenli (API bazen string fiyat döner)', () => {
    const result = formatCurrency("65116.01", "tr-TR", "USD");
    expect(result).toContain("65");
    expect(result).not.toBe("—");
  });

  test('formatCurrency "invalid" → "—"', () => {
    expect(formatCurrency("invalid", "tr-TR", "USD")).toBe("—");
  });
});
