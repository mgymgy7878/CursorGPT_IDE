export const cfg = {
  makerBps: +(process.env.PAPER_MAKER_FEE_BPS ?? 10),
  takerBps: +(process.env.PAPER_TAKER_FEE_BPS ?? 15),
  maxSlippageBps: +(process.env.PAPER_MAX_SLIPPAGE_BPS ?? 50),
  tickSize: +(process.env.PAPER_TICK_SIZE ?? 0.1),
  lotSize: +(process.env.PAPER_LOT_SIZE ?? 0.001),
  stopWatcherMs: +(process.env.PAPER_STOP_WATCHER_MS ?? 1000),
};

export const roundTick = (p: number) => Math.round(p / cfg.tickSize) * cfg.tickSize;

// Config override (in-memory, restart gerekmeden)
let configOverride: Partial<typeof cfg> = {};

export const getConfig = () => ({ ...cfg, ...configOverride });

export const setConfig = (updates: Partial<typeof cfg>) => {
  // Whitelist kontrolü
  const allowedKeys = [
    'makerBps', 'takerBps', 'maxSlippageBps', 'tickSize', 'lotSize', 'stopWatcherMs'
  ] as const;
  
  const filtered: Partial<typeof cfg> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedKeys.includes(key as keyof typeof cfg)) {
      const numValue = +value;
      if (!isNaN(numValue) && numValue >= 0) {
        filtered[key as keyof typeof cfg] = numValue;
      }
    }
  }
  
  configOverride = { ...configOverride, ...filtered };
  return filtered;
};

export const resetConfig = () => {
  configOverride = {};
}; 