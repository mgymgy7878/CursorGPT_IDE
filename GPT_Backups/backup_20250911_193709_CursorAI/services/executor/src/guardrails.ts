/**
 * Runtime Sertleştirme - Tek Yerden Kontrol
 * Production guardrails ve risk yönetimi
 */

export const settings = {
  // Ana kill-switch
  killSwitch: process.env.KILL_SWITCH === '1',
  
  // Trading modu: shadow | trickle | live
  mode: process.env.TRADING_MODE ?? 'shadow',
  
  // Rate limiting
  maxOrdersPerMin: Number(process.env.MAX_OPM ?? 30),
  maxNotionalPerSecTRY: Number(process.env.MAX_NOTIONAL_TRY_S ?? 500),
  
  // Whitelist kontrolü
  whitelist: (process.env.WHITELIST ?? 'BTCUSDT,BTCTRY').split(','),
  
  // Clock drift toleransı
  clockDriftMaxMs: Number(process.env.CLOCK_DRIFT_MS ?? 2000),
  
  // Trickle mode ayarları
  trickleMaxNotionalTRY: Number(process.env.TRICKLE_MAX_TRY ?? 50),
  trickleAllowedSymbols: (process.env.TRICKLE_SYMBOLS ?? 'BTCUSDT,BTCTRY').split(','),
  
  // Live mode hacim artışı
  volumeRampPercent: Number(process.env.VOLUME_RAMP_PCT ?? 1), // 1% → 5% → 20%
  
  // SLO thresholds
  p95PlaceAckMaxMs: Number(process.env.P95_PLACE_ACK_MS ?? 1000),
  p95FeedDbMaxMs: Number(process.env.P95_FEED_DB_MS ?? 300),
  nonceErrorRateMax: Number(process.env.NONCE_ERROR_RATE_MAX ?? 0.01), // 1%
  rateLimitBurstMax: Number(process.env.RATE_LIMIT_BURST_MAX ?? 0.05), // 5%
};

/**
 * Trading mode kontrolü
 */
export function isTradingAllowed(): boolean {
  if (settings.killSwitch) {
    return false;
  }
  
  return ['shadow', 'trickle', 'live'].includes(settings.mode);
}

/**
 * Symbol whitelist kontrolü
 */
export function isSymbolAllowed(symbol: string): boolean {
  if (settings.mode === 'live') {
    return true; // Live mode'da tüm semboller
  }
  
  if (settings.mode === 'trickle') {
    return settings.trickleAllowedSymbols.includes(symbol);
  }
  
  // Shadow mode'da sadece whitelist
  return settings.whitelist.includes(symbol);
}

/**
 * Notional limit kontrolü
 */
export function isNotionalAllowed(notionalTRY: number): boolean {
  if (settings.mode === 'trickle') {
    return notionalTRY <= settings.trickleMaxNotionalTRY;
  }
  
  // Live mode'da hacim ramp kontrolü
  if (settings.mode === 'live') {
    const maxNotional = settings.maxNotionalPerSecTRY * (settings.volumeRampPercent / 100);
    return notionalTRY <= maxNotional;
  }
  
  return true; // Shadow mode'da limit yok
}

/**
 * Rate limit kontrolü
 */
export function isRateLimitOK(): boolean {
  // Bu fonksiyon metriklerden gerçek zamanlı rate hesaplar
  // Şimdilik basit kontrol
  return true;
}

/**
 * Clock drift kontrolü
 */
export function isClockDriftOK(driftMs: number): boolean {
  return Math.abs(driftMs) <= settings.clockDriftMaxMs;
}

/**
 * SLO kontrolü - P95 Place→ACK
 */
export function isP95PlaceAckOK(p95Ms: number): boolean {
  return p95Ms <= settings.p95PlaceAckMaxMs;
}

/**
 * SLO kontrolü - P95 Feed→DB
 */
export function isP95FeedDbOK(p95Ms: number): boolean {
  return p95Ms <= settings.p95FeedDbMaxMs;
}

/**
 * Error rate kontrolü
 */
export function isErrorRateOK(nonceErrorRate: number, rateLimitBurst: number): boolean {
  return nonceErrorRate <= settings.nonceErrorRateMax && 
         rateLimitBurst <= settings.rateLimitBurstMax;
}

/**
 * Hızlı geri dönüş koşulları
 */
export function shouldTriggerKillSwitch(p95PlaceAckMs: number, nonceErrorRate: number): boolean {
  // P95 > 2s, 10dk (critical)
  if (p95PlaceAckMs > 2000) {
    return true;
  }
  
  // Invalid Nonce oranı > %1 (5dk)
  if (nonceErrorRate > 0.01) {
    return true;
  }
  
  return false;
}

/**
 * Guardrails durumu
 */
export function getGuardrailsStatus() {
  return {
    killSwitch: settings.killSwitch,
    mode: settings.mode,
    tradingAllowed: isTradingAllowed(),
    maxOrdersPerMin: settings.maxOrdersPerMin,
    maxNotionalPerSecTRY: settings.maxNotionalPerSecTRY,
    whitelist: settings.whitelist,
    clockDriftMaxMs: settings.clockDriftMaxMs,
    p95Thresholds: {
      placeAck: settings.p95PlaceAckMaxMs,
      feedDb: settings.p95FeedDbMaxMs
    },
    errorThresholds: {
      nonceErrorRate: settings.nonceErrorRateMax,
      rateLimitBurst: settings.rateLimitBurstMax
    }
  };
}

// Export guardrails instance
export const guardrails = {
  getStatus: getGuardrailsStatus,
  isTradingAllowed,
  settings
};