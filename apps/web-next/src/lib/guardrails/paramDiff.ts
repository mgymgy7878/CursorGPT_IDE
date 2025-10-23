export type Diff = { path: string; from: unknown; to: unknown };

export function paramDiff(a: unknown, b: unknown): Diff[] {
  const out: Diff[] = [];
  walk(a, b, "");
  return out;
  function walk(x: any, y: any, p: string) {
    if (Object.is(x, y)) return;
    const ox = x && typeof x === "object";
    const oy = y && typeof y === "object";
    if (ox && oy) {
      const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
      for (const k of keys) walk(x?.[k], y?.[k], p ? `${p}.${k}` : k);
    } else {
      out.push({ path: p, from: x, to: y });
    }
  }
}

// Kaba bir risk heuristiği (0–10)
export function riskScore(diffs: Diff[]): number {
  let r = 0;
  for (const d of diffs) {
    const k = d.path.toLowerCase();
    if (k.includes("leverage") || k.includes("kaldirac")) r += 5;
    if (k.includes("size") || k.includes("amount") || k.includes("notional")) r += 3;
    if (k.includes("stop") && k.includes("distance")) r += 2;
  }
  return Math.min(10, r);
}


