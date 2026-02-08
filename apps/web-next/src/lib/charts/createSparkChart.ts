/**
 * createSparkChart - Helper to create lightweight-charts chart with Spark defaults
 *
 * Tek kapıdan chart yaratma (factory):
 * - theme/layout/timeScale/grid/crosshair default'ları tek yerde
 * - attributionLogo: false (Spark Trading requirement)
 * - Retina scaling, resize observer, chart.remove() cleanup standardı
 *
 * Kullanım:
 * ```ts
 * import { createSparkChart } from "@/lib/charts/createSparkChart";
 * const chart = createSparkChart(container, { width: 800, height: 400 });
 * ```
 */

import { createChart, IChartApi, type ChartOptions, type DeepPartial, ColorType } from 'lightweight-charts';

export interface SparkChartOptions extends DeepPartial<ChartOptions> {
  // Retina scaling (devicePixelRatio)
  retina?: boolean;
  // Auto resize via ResizeObserver
  autoResize?: boolean;
}

/**
 * Create chart with Spark defaults
 */
export function createSparkChart(
  container: HTMLElement,
  options: SparkChartOptions = {}
): IChartApi {
  const {
    retina = true,
    autoResize = true,
    ...chartOptions
  } = options;

  // Retina scaling: devicePixelRatio'ya göre width/height ayarla
  const baseWidth = chartOptions.width || container.clientWidth || 800;
  const baseHeight = chartOptions.height || container.clientHeight || 400;
  const dpr = retina && typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const chart = createChart(container, {
    // Spark defaults - NO TradingView, pure lightweight-charts (Apache 2.0)
    autoSize: autoResize, // ResizeObserver destekliyse kendi resize işini yapar

    // Layout defaults (dark theme)
    layout: {
      attributionLogo: false, // NO TradingView logos (lightweight-charts Apache 2.0, no attribution required)
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#d1d5db', // Dark temada görünür gri
      ...chartOptions.layout,
    },

    // Grid defaults (dark theme)
    grid: {
      horzLines: {
        visible: true,
        color: '#374151', // Dark temada görünür grid
        style: 1,
        ...chartOptions.grid?.horzLines,
      },
      vertLines: {
        visible: true,
        color: '#374151',
        style: 1,
        ...chartOptions.grid?.vertLines,
      },
      ...chartOptions.grid,
    },

    // Time scale defaults
    timeScale: {
      visible: false,
      rightOffset: 0,
      borderVisible: false,
      ...chartOptions.timeScale,
    },

    // Price scale defaults
    rightPriceScale: {
      visible: false,
      borderVisible: false,
      ...chartOptions.rightPriceScale,
    },
    leftPriceScale: {
      visible: false,
      borderVisible: false,
      ...chartOptions.leftPriceScale,
    },

    // Crosshair defaults (sparkline için disabled)
    crosshair: {
      mode: 0, // Disabled for sparkline
      ...chartOptions.crosshair,
    },

    // Size (retina scaling)
    width: retina ? Math.floor(baseWidth * dpr) : baseWidth,
    height: retina ? Math.floor(baseHeight * dpr) : baseHeight,

    // User overrides (en son, öncelikli)
    ...chartOptions,
  } as any);

  // Sigorta: Chart oluşturulduktan sonra tekrar kontrol et (attributionLogo her zaman false)
  chart.applyOptions({ layout: { attributionLogo: false } });

  return chart;
}

/**
 * Cleanup helper: chart.remove() standardı
 */
export function removeSparkChart(chart: IChartApi | null): void {
  if (chart) {
    try {
      chart.remove();
    } catch (e) {
      console.warn('[createSparkChart] remove failed:', e);
    }
  }
}
