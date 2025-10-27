export type AlertType = 'bb_break' | 'fib_touch' | 'macd_cross' | 'stoch_cross';

export interface BaseAlert {
  id: string;
  symbol: string;
  timeframe: string;
  type: AlertType;
  active: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
}

export interface BBBreakParams {
  period?: number;
  stdDev?: number;
  side: 'above' | 'below' | 'both';
}

export interface FibTouchParams {
  lookback?: number;
  tolerance?: number;
  level?: number;
}

export interface MacdCrossParams {
  fast?: number;
  slow?: number;
  signal?: number;
  mode: 'signal' | 'zero';
  side: 'bullish' | 'bearish' | 'both';
}

export interface StochCrossParams {
  kPeriod?: number;
  dPeriod?: number;
  side: 'overbought' | 'oversold' | 'k_cross_d' | 'all';
}

export type AlertParams = BBBreakParams | FibTouchParams | MacdCrossParams | StochCrossParams;

export interface Alert extends BaseAlert {
  params: AlertParams;
}

export interface TriggerEvent {
  id: string;
  symbol: string;
  timeframe: string;
  type: AlertType;
  reason: string;
  value?: any;
  ts: number;
}

