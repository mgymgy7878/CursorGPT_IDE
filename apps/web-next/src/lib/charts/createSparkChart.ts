/**
 * createSparkChart - Helper to create lightweight-charts chart with attributionLogo disabled
 */

import { createChart, IChartApi, ChartOptions } from 'lightweight-charts';

export function createSparkChart(
  container: HTMLElement,
  options: ChartOptions
): IChartApi {
  const chart = createChart(container, {
    ...options,
    // Disable attribution logo (required for Spark Trading)
    attributionLogo: false,
  });

  return chart;
}
