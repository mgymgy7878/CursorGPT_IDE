import type { Request, Response } from "express";

export interface RiskCheck {
  allowed: boolean;
  reason?: string;
  code?: string;
}

export interface LiveConfig {
  liveTrading: number; // 0: kapalı | 1: ARM | 2: CONFIRM sonrası aktif
  whitelist: string[];
  maxNotional: number;
  dailyLossCap: number;
  cooldownMs: number;
  tradeWindow: string;
  shadowMode: boolean;
  confirmPhrase: string;
  killSwitch: boolean;
}

const DEFAULT_CONFIG: LiveConfig = {
  liveTrading: parseInt(process.env.LIVE_TRADING || '0'),
  whitelist: (process.env.TRADE_WHITELIST || 'BTCUSDT,ETHUSDT').split(','),
  maxNotional: parseFloat(process.env.LIVE_MAX_NOTIONAL || '20'),
  dailyLossCap: parseFloat(process.env.RISK_DAILY_LOSS_CAP || '100'),
  cooldownMs: parseInt(process.env.RISK_COOLDOWN_MS || '60000'),
  tradeWindow: process.env.TRADE_WINDOW || '07:00-23:30',
  shadowMode: process.env.SHADOW_MODE === '1',
  confirmPhrase: process.env.REQUIRE_CONFIRM_PHRASE || 'CONFIRM LIVE TRADE',
  killSwitch: process.env.TRADING_KILL_SWITCH === '1'
};

let lastTradeTime = 0;

export function checkWhitelist(symbol: string): RiskCheck {
  const config = getConfig();
  
  if (!config.whitelist.includes(symbol)) {
    return {
      allowed: false,
      reason: `Symbol ${symbol} not in whitelist`,
      code: 'whitelist_violation'
    };
  }
  
  return { allowed: true };
}

export function checkNotional(qty: number, price: number): RiskCheck {
  const config = getConfig();
  const notional = qty * price;
  
  if (notional > config.maxNotional) {
    return {
      allowed: false,
      reason: `Notional ${notional.toFixed(2)} exceeds limit ${config.maxNotional}`,
      code: 'notional_limit_exceeded'
    };
  }
  
  return { allowed: true };
}

export function checkWindow(): RiskCheck {
  const config = getConfig();
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const [startStr, endStr] = config.tradeWindow.split('-');
  const startTime = parseInt((startStr || '07:00').replace(':', ''));
  const endTime = parseInt((endStr || '23:30').replace(':', ''));
  
  if (currentTime < startTime || currentTime > endTime) {
    return {
      allowed: false,
      reason: `Outside trade window ${config.tradeWindow}`,
      code: 'outside_trade_window'
    };
  }
  
  return { allowed: true };
}

export function checkCooldown(): RiskCheck {
  const config = getConfig();
  const now = Date.now();
  
  if (now - lastTradeTime < config.cooldownMs) {
    return {
      allowed: false,
      reason: `Cooldown period not elapsed`,
      code: 'cooldown_active'
    };
  }
  
  return { allowed: true };
}

export function checkKillSwitch(): RiskCheck {
  const config = getConfig();
  
  if (config.killSwitch) {
    return {
      allowed: false,
      reason: 'Trading kill switch is active',
      code: 'kill_switch_active'
    };
  }
  
  return { allowed: true };
}

export function checkLiveTrading(mode: 'arm' | 'confirm', confirmPhrase?: string): RiskCheck {
  const config = getConfig();
  
  if (config.liveTrading === 0) {
    return {
      allowed: false,
      reason: 'Live trading is disabled',
      code: 'live_trading_disabled'
    };
  }
  
  if (mode === 'arm' && config.liveTrading === 1) {
    return {
      allowed: false,
      reason: 'System is armed but not confirmed',
      code: 'arm_only'
    };
  }
  
  if (mode === 'confirm' && config.liveTrading === 2) {
    if (confirmPhrase !== config.confirmPhrase) {
      return {
        allowed: false,
        reason: 'Invalid confirmation phrase',
        code: 'confirm_required'
      };
    }
  }
  
  return { allowed: true };
}

export function checkAll(symbol: string, qty: number, price: number, mode: 'arm' | 'confirm' = 'confirm', confirmPhrase?: string): RiskCheck {
  // Check kill switch first
  const killCheck = checkKillSwitch();
  if (!killCheck.allowed) return killCheck;
  
  // Check live trading mode
  const liveCheck = checkLiveTrading(mode, confirmPhrase);
  if (!liveCheck.allowed) return liveCheck;
  
  // Check whitelist
  const whitelistCheck = checkWhitelist(symbol);
  if (!whitelistCheck.allowed) return whitelistCheck;
  
  // Check notional limit
  const notionalCheck = checkNotional(qty, price);
  if (!notionalCheck.allowed) return notionalCheck;
  
  // Check trade window
  const windowCheck = checkWindow();
  if (!windowCheck.allowed) return windowCheck;
  
  // Check cooldown
  const cooldownCheck = checkCooldown();
  if (!cooldownCheck.allowed) return cooldownCheck;
  
  return { allowed: true };
}

export function getConfig(): LiveConfig {
  return DEFAULT_CONFIG;
}

export function updateLastTradeTime(): void {
  lastTradeTime = Date.now();
}

export function isShadowMode(): boolean {
  return getConfig().shadowMode;
} 

export function checkTradingMode(req: Request, res: Response): boolean {
  const mode = Number(process.env.LIVE_TRADING ?? "0");
  if (mode === 1) {
    res.status(403).json({ code: "arm_only" });
    return false;
  }
  if (mode === 2) {
    const { confirmPhrase } = req.body;
    if (!confirmPhrase || confirmPhrase !== "CONFIRM LIVE TRADE") {
      res.status(400).json({ code: "missing_confirm_phrase" });
      return false;
    }
    return true;
  }
  res.status(400).json({ code: "invalid_trading_mode" });
  return false;
} 