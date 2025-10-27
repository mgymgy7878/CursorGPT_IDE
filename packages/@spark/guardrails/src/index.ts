export type RiskThresholds = { 
  maxNotional?: number; 
  maxDrawdownPct?: number; 
  pnlDayLimit?: number; 
};

export type CheckContext = { 
  portfolioNotional: number; 
  drawdownPct: number; 
  pnlDay: number; 
};

export type Decision = { 
  allow: boolean; 
  reason?: string 
};

export function check(ctx: CheckContext, th: RiskThresholds): Decision {
  if (th.maxNotional && ctx.portfolioNotional > th.maxNotional) {
    return { allow: false, reason: 'max_notional' };
  }
  if (th.maxDrawdownPct && ctx.drawdownPct > th.maxDrawdownPct) {
    return { allow: false, reason: 'max_drawdown' };
  }
  if (th.pnlDayLimit && ctx.pnlDay < -Math.abs(th.pnlDayLimit)) {
    return { allow: false, reason: 'pnl_day' };
  }
  return { allow: true };
}

export type ParamSet = Record<string, unknown>;

export function diffParams(oldP: ParamSet, newP: ParamSet) {
  const changed: Record<string, { from: any; to: any }> = {};
  const keys = new Set([...Object.keys(oldP || {}), ...Object.keys(newP || {})]);
  
  for (const k of keys) {
    if (JSON.stringify(oldP?.[k]) !== JSON.stringify(newP?.[k])) {
      changed[k] = { from: oldP?.[k], to: newP?.[k] };
    }
  }
  
  return changed;
}
