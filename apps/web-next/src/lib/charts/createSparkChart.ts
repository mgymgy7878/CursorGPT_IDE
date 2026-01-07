/**
 * createSparkChart - Spark Trading Chart Helper (SSOT - Single Source of Truth)
 *
 * ⚠️ KRİTİK: Bu helper dışında createChart() kullanmayın!
 * Tüm chart instance'ları bu helper üzerinden oluşturulmalı.
 *
 * Zorunlu attributionLogo: false ile chart oluşturur.
 * Bu sayede TradingView logo/attribution hiçbir zaman görünmez.
 *
 * 2 katmanlı koruma (ChatGPT önerisi - CSS minimumda):
 * 1. layout.attributionLogo: false (resmi format)
 * 2. applyOptions ile create sonrası garanti
 * 3. CSS (globals.css) - sadece attribution link'ini hedefleyen dar selector
 */

import { createChart, IChartApi, ChartOptions } from 'lightweight-charts';

// Esnek chart options - tüm option'lar Partial olabilir (kullanım kolaylığı için)
// DeepPartial utility type ile nested option'lar da Partial olur
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type SparkChartOptions = DeepPartial<ChartOptions> & {
  layout?: DeepPartial<ChartOptions['layout']> & {
    attributionLogo?: boolean;
  };
};

/**
 * Spark Trading için chart oluştur (attributionLogo zorunlu false)
 *
 * PATCH: Sadece resmi layout.attributionLogo ayarını kullan (top-level kaldırıldı)
 * Lightweight Charts v5'te layout.attributionLogo: false genelde yeterli
 */
export function createSparkChart(
  container: HTMLElement,
  options: SparkChartOptions
): IChartApi {
  // Base options - SADECE layout.attributionLogo kullan (resmi format)
  const baseOptions = {
    ...options,
    layout: {
      ...options.layout,
      attributionLogo: false,
    },
  } as any;

  const chart = createChart(container, baseOptions);

  // Garanti: create sonrası applyOptions ile uygula
  try {
    chart.applyOptions({ layout: { attributionLogo: false } });
  } catch (e) {
    // Ignore - bazı sürümlerde bu seçenek desteklenmeyebilir
  }

  // Dev-only runtime alarm: TradingView attribution link görünürse uyar
  // Bu, kütüphane güncellemesiyle attribute geri gelirse "ilk açan görür" alarmı olur
  // Prod bundle optimizasyonu: Dinamik import ile sadece dev'de yüklenir
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    import('./devAttributionAlarm').then(({ devAttributionAlarm }) => {
      devAttributionAlarm(container, { where: 'createSparkChart' });
    }).catch(() => {
      // Ignore import errors (shouldn't happen in dev)
    });
  }

  return chart;
}

