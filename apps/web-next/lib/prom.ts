export type MetricMap = Record<string, number>;

export function parsePromText(text: string): MetricMap {
  const out: MetricMap = {};
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const sp = line.lastIndexOf(' ');
    if (sp <= 0) continue;

    const metricWithLabels = line.slice(0, sp);
    const valStr = line.slice(sp + 1);
    const val = Number(valStr);
    if (!Number.isFinite(val)) continue;

    let name = metricWithLabels;
    const lb = metricWithLabels.indexOf('{');
    let labels: Record<string, string> = {};
    if (lb !== -1) {
      name = metricWithLabels.slice(0, lb);
      const rb = metricWithLabels.lastIndexOf('}');
      const lbl = metricWithLabels.slice(lb + 1, rb);
      for (const part of lbl.split(',')) {
        const [k, v] = part.split('=');
        if (!k || v == null) continue;
        labels[k.trim()] = v.trim().replace(/^"|"$/g, '');
      }
    }

    // summary quantiles: latency_ms{quantile="0.95"} 850
    if (labels.quantile) {
      const q = Number(labels.quantile);
      if (q === 0.95) out[`${name}_p95`] = val;
      else if (q === 0.5) out[`${name}_p50`] = val;
      continue;
    }

    // histogram buckets: *_bucket satırlarını atla; _sum/_count bırak
    if (name.endsWith('_bucket')) continue;

    out[name] = val;
  }
  return out;
}

// --- Yeni: Etiketli parser & yardımcılar (breaking change DEĞİL) ---
export interface LabeledMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export function parsePromTextLabeled(text: string): LabeledMetric[] {
  const out: LabeledMetric[] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const sp = line.lastIndexOf(' ');
    if (sp <= 0) continue;
    const metricWithLabels = line.slice(0, sp);
    const valStr = line.slice(sp + 1);
    const value = Number(valStr);
    if (!Number.isFinite(value)) continue;

    let name = metricWithLabels;
    let labels: Record<string, string> = {};
    const lb = metricWithLabels.indexOf('{');
    if (lb !== -1) {
      name = metricWithLabels.slice(0, lb);
      const rb = metricWithLabels.lastIndexOf('}');
      const lbl = metricWithLabels.slice(lb + 1, rb);
      for (const part of lbl.split(',')) {
        const [k, v] = part.split('=');
        if (!k || v == null) continue;
        labels[k.trim()] = v.trim().replace(/^"|"$/g, '');
      }
    }

    if (name.endsWith('_bucket')) continue; // histogram bucket atla
    // quantile'ları *_p95/*_p50 anahtarına dönüştür
    if (labels.quantile) {
      const q = Number(labels.quantile);
      if (q === 0.95) name = `${name}_p95`;
      else if (q === 0.5) name = `${name}_p50`;
      // quantile label'ı artık bilgi değeri taşımıyor; kaldır
      const { quantile, ...rest } = labels;
      labels = rest;
    }
    out.push({ name, labels, value });
  }
  return out;
}

export function getMetricValue(
  list: LabeledMetric[] | undefined,
  names: string[],
  mustLabels?: Record<string, string>
): number | undefined {
  if (!list || !list.length) return undefined;
  outer: for (const n of names) {
    for (const m of list) {
      if (m.name !== n) continue;
      if (mustLabels) {
        for (const [k, v] of Object.entries(mustLabels)) {
          if (m.labels[k] !== v) continue outer;
        }
      }
      return m.value;
    }
  }
  return undefined;
} 