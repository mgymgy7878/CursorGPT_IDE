/**
 * Backtest Risk Filter Types
 *
 * Epic E - Backtest Risk Filter v1
 * Backtest sonuçlarını Risk Architecture Baseline v1'e bağlamak için DTO'lar.
 */

import type { Regime } from './right-rail';

/**
 * Backtest Performance Metrics
 */
export interface BacktestMetricsDto {
  pnl: number;                    // Toplam P&L (USD)
  maxDrawdown: number;            // Maksimum drawdown (%)
  winRate: number;                 // Kazanma oranı (0-1)
  tradeCount: number;             // Toplam işlem sayısı
  sharpe?: number;                // Sharpe oranı (opsiyonel)
  sortino?: number;               // Sortino oranı (opsiyonel)
  avgTradeDuration?: number;      // Ortalama işlem süresi (saniye, opsiyonel)
  maxConsecutiveLosses?: number;  // Maksimum ardışık kayıp sayısı (opsiyonel)
  volatility?: number;            // Volatilite (%)
  asOfIso: string;                // ISO 8601 timestamp
}

/**
 * Strategy Candidate (Backtest edilen strateji adayı)
 */
export interface StrategyCandidateDto {
  id: string;                     // Unique strategy candidate ID
  name: string;                   // Strateji adı
  parameters: Record<string, unknown>; // Parametre seti (key-value pairs)
  market: string;                 // Piyasa (örn: "BTC/USDT", "ETH/USDT")
  timeframe: string;               // Zaman dilimi (örn: "1h", "4h", "1d")
  leverage?: number;               // Kaldıraç (opsiyonel)
  tags?: string[];                 // Etiketler (opsiyonel)
  description?: string;             // Açıklama (opsiyonel)
  asOfIso: string;                 // ISO 8601 timestamp
}

/**
 * Backtest Risk Evaluation Result
 */
export interface BacktestRiskEvaluationDto {
  candidate: StrategyCandidateDto; // Orijinal candidate (değişmez)
  metrics: BacktestMetricsDto;     // Orijinal metrics (değişmez)
  riskScore: number;               // 0-100 arası risk skoru (yüksek = riskli)
  regime: Regime;                  // Risk rejimi (normal | caution | stress | panic)
  verdict: 'approved' | 'needs_tuning' | 'rejected'; // Risk filtresi kararı
  reasons: string[];               // Verdict nedenleri (insan okunabilir)
  recommendations?: string[];      // Öneriler (opsiyonel, needs_tuning için)
  evaluatedAtIso: string;          // ISO 8601 timestamp
}

