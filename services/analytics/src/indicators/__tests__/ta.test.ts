import { describe, test, expect } from 'vitest';
import { FIB, BB, BB_ROLLING } from '../ta';

test('FIB 0-100', () => {
  const lvls = FIB(100, 0);
  expect(lvls.find(x => x.ratio === 0.618)?.price).toBeCloseTo(38.2, 1);
  expect(lvls.find(x => x.ratio === 0.5)?.price).toBeCloseTo(50, 1);
  expect(lvls[0].price).toBeCloseTo(100, 1);   // 0% (high)
  expect(lvls[lvls.length - 1].price).toBeCloseTo(0, 1); // 100% (low)
});

test('FIB inverted range', () => {
  const lvls = FIB(0, 100); // low, high swapped
  expect(lvls.find(x => x.ratio === 0.618)?.price).toBeCloseTo(38.2, 1);
  expect(lvls[0].price).toBeCloseTo(100, 1);
});

test('BB 5-period', () => {
  const data = [100, 110, 105, 115, 120];
  const res = BB(data, 5, 2);
  const last = res[res.length - 1];
  expect(last.m).toBeCloseTo(110, 2);
  expect(last.u).toBeGreaterThan(last.m);
  expect(last.l).toBeLessThan(last.m);
});

test('BB insufficient data', () => {
  const data = [100, 110, 105];
  expect(() => BB(data, 5, 2)).toThrow('Need >= 5 closes');
});

test('BB 20-period default', () => {
  const data = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 5) * 10);
  const res = BB(data); // defaults: period=20, mult=2
  const last = res[res.length - 1];
  expect(last.m).toBeDefined();
  expect(last.u).toBeGreaterThan(last.m);
  expect(last.l).toBeLessThan(last.m);
  expect(res.length).toBe(30);
  // First 19 should be NaN
  expect(res[18].m).toBeNaN();
  expect(res[19].m).not.toBeNaN();
});

test('BB_ROLLING ~ BB close enough', () => {
  const data = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.1);
  const a = BB(data, 20, 2);
  const b = BB_ROLLING(data, 20, 2);
  const lastA = a[a.length - 1];
  const lastB = b[b.length - 1];
  expect(Math.abs(lastA.m - lastB.m)).toBeLessThan(0.1);
  expect(Math.abs(lastA.u - lastB.u)).toBeLessThan(0.2);
  expect(Math.abs(lastA.l - lastB.l)).toBeLessThan(0.2);
});

