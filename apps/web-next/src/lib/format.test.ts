/**
 * Format helpers test suite
 * V1.3-P3: Full coverage for formatCurrency, formatNumber
 */

import { formatCurrency, formatNumber, formatPercent, formatDuration } from "./format";

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

