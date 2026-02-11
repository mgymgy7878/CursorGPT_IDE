/**
 * RightRail DTOs - Shared types for UI and backend
 *
 * Bu dosya RightRail panelleri için ortak veri kontratlarını tanımlar.
 * Hem UI (web-next) hem backend (executor) tarafında kullanılır.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface TopRisksDto {
  mostRiskyStrategy: {
    id: string;
    name: string;
    symbol: string;          // ör: "BTCUSDT"
    timeframe: string;       // ör: "15m"
    currentDrawdownPct: number; // -3.1
    maxAllowedDrawdownPct: number; // -5
    pnl24hPct: number;       // 1.2
  };
  mostConcentratedMarket: {
    symbol: string;          // "BTCUSDT"
    weightPct: number;       // portföydeki ağırlık
    positions: number;       // açık pozisyon adedi
  };
  dailyMaxDrawdown: {
    valuePct: number;        // -3.1
    limitPct: number;        // -5
  };
  newsImpact: {
    level: RiskLevel;        // low | medium | high
    summary: string;
  };
  meta: {
    markets: string[];       // ["BTCUSDT", "ETHUSDT", ...]
    strategiesActive: number;
    portfolioStatus: 'normal' | 'caution' | 'stress';
  };
  lastUpdatedIso: string;
}

export interface SystemStatusDto {
  api: 'up' | 'down' | 'degraded';
  ws: 'up' | 'down' | 'degraded';
  executor: {
    status: 'up' | 'down' | 'degraded';
    p95LatencyMs: number;
  };
  evidenceBalancePct: number; // EB %
  lastUpdatedIso: string;
}

export interface ExchangeHealthItemDto {
  name: 'Binance' | 'BTCTurk' | 'BIST' | string;
  status: 'up' | 'down' | 'degraded';
  lastSyncAgoSec: number;
  rateLimitUsedPct: number;   // 0-100
  latencyMs: number;
}

export interface ExchangeHealthDto {
  exchanges: ExchangeHealthItemDto[];
  lastUpdatedIso: string;
}

export interface RightRailSnapshotDto {
  topRisks: TopRisksDto;
  systemStatus: SystemStatusDto;
  exchangeHealth: ExchangeHealthDto;
  asOfIso: string;
}

// Copilot/AI için özet DTO
export type Regime = 'normal' | 'caution' | 'stress' | 'panic';

export interface RightRailSummaryDto {
  riskScore: number;      // 0-100
  regime: Regime;
  summary: string;        // tek paragraf
  bullets: string[];      // madde madde risk noktaları
  asOfIso: string;
}

// Copilot Risk Brain v1 - Risk Policy Types
export type RiskActionType = 'reduce_leverage' | 'block_new_strategies' | 'close_positions' | 'no_action';

export interface RiskAction {
  type: RiskActionType;
  reason: string;          // İnsan okunabilir açıklama
}

export interface CopilotRiskAdviceDto {
  regime: Regime;
  riskScore: number;      // 0-100 (RightRailSummaryDto'dan)
  actions: RiskAction[];   // Önerilen aksiyonlar (öncelik sırasına göre)
  humanSummary: string;    // İnsan okunabilir özet (LLM olmadan deterministik)
  asOfIso: string;
}

// Copilot Risk Brain v1 - LLM Enrichment
export interface CopilotRiskAdviceLlmDto {
  advice: CopilotRiskAdviceDto;  // Deterministik policy çıktısı (değişmez)
  llmSummary: string;            // LLM ile zenginleştirilmiş açıklama
  scenarios: string[];            // 2-3 madde "eğer X ise Y yap" senaryoları
  asOfIso: string;
}

// Guardrails + Aksiyon Yüzeyi v1 - Risk Action Execution
export interface RiskActionExecutionDto {
  id: string;                     // Unique execution ID
  type: RiskActionType;           // reduce_leverage | block_new_strategies | close_positions | no_action
  reason: string;                 // İnsan okunabilir açıklama
  scope: {
    strategyIds?: string[];       // Hangi stratejiler etkilenecek (opsiyonel)
    positionIds?: string[];       // Hangi pozisyonlar etkilenecek (opsiyonel)
    leverageTarget?: number;      // Hedef kaldıraç seviyesi (reduce_leverage için)
  };
  dryRun: boolean;                // Bu epikte her zaman true
  estimatedImpact?: {
    affectedStrategies: number;
    affectedPositions: number;
    leverageChange?: number;      // Kaldıraç değişimi (ör. 5x → 3x = -2x)
  };
  asOfIso: string;
}

export interface RiskActionPlanDto {
  advice: CopilotRiskAdviceDto;  // Orijinal advice (değişmez)
  candidateActions: RiskActionExecutionDto[];  // Planlanan aksiyonlar (sadece plan/simülasyon)
  summary: string;                // Plan özeti
  warnings?: string[];            // Uyarılar (opsiyonel)
  asOfIso: string;
}

// Execution Guardrails v1 - Execution Request & Guardrail Types
export type ExecutionEnvironment = 'sim' | 'prod';

export interface ExecutionRequestDto {
  planId: string;                 // RiskActionPlanDto'dan gelen id
  selectedActionIds: string[];     // Plan içinden seçilen aksiyonlar
  environment: ExecutionEnvironment;
  confirmRequired: true;           // Bu epic'te her zaman true
  requestedBy: string;             // userId / serviceId
  requestedAtIso: string;
}

export interface ExecutionGuardrailReason {
  code: string;        // "RISK_SCORE_TOO_HIGH", "PANIC_REGIME" vb.
  message: string;     // İnsan okunur açıklama
  severity: 'info' | 'warning' | 'error';
}

export interface ExecutionGuardrailResultDto {
  allowed: boolean;
  reasons: ExecutionGuardrailReason[];
  requiredApprovals: string[];   // ["risk_officer", "owner:strategy-123"] gibi
  evaluatedAtIso: string;
}

export interface RiskActionExecuteResponseDto {
  executionId: string;
  type: RiskActionType;
  dryRun: boolean;                // Bu epikte her zaman true
  simulatedCommands: Array<{
    command: string;              // Örnek: "close_position", "reduce_leverage"
    target: string;               // Örnek: "strategy_123", "position_456"
    params: Record<string, unknown>;
  }>;
  estimatedImpact: {
    affectedStrategies: number;
    affectedPositions: number;
    leverageChange?: number;
  };
  message: string;                // "X pozisyonu kapatmayı DENESEYDİK şöyle olurdu" tarzı
  guardrailResult: ExecutionGuardrailResultDto; // Yeni: Guardrail değerlendirme sonucu
  asOfIso: string;
}

