/**
 * Centralized Chart Type Definitions
 * 
 * Single source of truth for all recharts components.
 * Use these types instead of inline definitions.
 */

/**
 * Base chart data point with timestamp
 */
export type ChartPoint<T extends Record<string, number | string> = Record<string, number>> = {
  timestamp: number;
} & T;

/**
 * Time series data point
 */
export type TimeSeriesPoint = ChartPoint<{
  value: number;
}>;

/**
 * SLO metrics data point
 */
export type SLODataPoint = ChartPoint<{
  p95_ms: number;
  staleness_s: number;
  error_rate: number;
}>;

/**
 * OHLCV candlestick data
 */
export type CandlestickPoint = ChartPoint<{
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>;

/**
 * Technical indicator data
 */
export type IndicatorPoint = ChartPoint<{
  [indicator: string]: number;
}>;

/**
 * MACD data point
 */
export type MACDPoint = {
  i: number;
  macd: number;
  signal: number;
  histogram?: number;
};

/**
 * Price chart with indicators
 */
export type PriceChartPoint = ChartPoint<{
  price: number;
  sma?: number;
  ema?: number;
  volume?: number;
}>;

/**
 * Volume profile data
 */
export type VolumeProfilePoint = {
  price: number;
  volume: number;
  percentage: number;
};

/**
 * RSI data point
 */
export type RSIPoint = {
  i: number;
  rsi: number;
};

/**
 * Fibonacci retracement level
 */
export type FibonacciLevel = {
  ratio: number;
  price: number;
  label: string;
};

/**
 * Chart axis domain
 */
export type AxisDomain = [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];

/**
 * Chart color scheme
 */
export const ChartColors = {
  primary: '#3b82f6',
  secondary: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  up: '#10b981',
  down: '#ef4444',
  grid: '#404040',
  axis: '#737373',
  tooltip: {
    bg: '#171717',
    border: '#404040',
    text: '#999'
  }
} as const;

/**
 * Chart dimensions
 */
export type ChartDimensions = {
  width?: number | string;
  height?: number | string;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
};

/**
 * Tooltip formatter type
 */
export type TooltipFormatter = (value: number, name: string) => [string, string];

/**
 * Label formatter type
 */
export type LabelFormatter = (label: number | string) => string;

