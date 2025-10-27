export const n = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
};

export const fmtNum = (v: unknown, opts?: Intl.NumberFormatOptions) => {
  const num = n(v);
  return num === null ? "—" : num.toLocaleString("tr-TR", opts);
};

export const fmtCur = (v: unknown, currency = "TRY") => {
  const num = n(v);
  return num === null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(num);
};

export const fmtPct = (v: unknown) => {
  const num = n(v);
  return num === null
    ? "—"
    : new Intl.NumberFormat("tr-TR", {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(num as number / 100);
};

export const fmtDate = (v: unknown) => {
  const d = v ? new Date(String(v)) : null;
  return d && !isNaN(+d) ? d.toLocaleString("tr-TR") : "—";
};
