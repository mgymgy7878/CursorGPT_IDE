// TR yerelleştirme format yardımcıları
export const fmtCurrencyTR = (v: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(v);

export const fmtNumberTR = (v: number) =>
  new Intl.NumberFormat("tr-TR").format(v);

export const fmtPercentageTR = (v: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "percent",
    maximumFractionDigits: 2
  }).format(v / 100);
