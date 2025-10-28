// Copilot Policy Guard
import type { ActionJSON } from '@/types/copilot';

const PROTECTED_ACTIONS = [
  'risk/threshold.set',
  'model/promote',
  'model/downgrade',
  'trade/open',
  'trade/close',
  'trade/closeall',
  'position/open',
  'position/close',
  'strategy/stop',
  'strategy/start',
  'config/deploy',
  'portfolio/rebalance',
];

const READ_ONLY_ACTIONS = [
  'tools/get_status',
  'tools/get_metrics',
  'tools/get_orders',
  'tools/get_positions',
  'tools/get_alerts',
  'canary/run',
  'backtest/run',
];

export function enforcePolicy(
  action: ActionJSON,
  hasAdminToken: boolean
): { allowed: boolean; error?: string; needsConfirm?: boolean } {
  // Read-only actions always allowed
  if (READ_ONLY_ACTIONS.includes(action.action)) {
    return { allowed: true };
  }

  // Protected actions require admin token
  if (PROTECTED_ACTIONS.includes(action.action)) {
    if (!hasAdminToken) {
      return {
        allowed: false,
        error: 'ADMIN_TOKEN required for protected actions',
      };
    }

    // If confirm_required, must be dryRun first
    if (action.confirm_required && !action.dryRun) {
      return {
        allowed: false,
        error: 'Dry run required before confirmation',
        needsConfirm: true,
      };
    }

    return { allowed: true, needsConfirm: action.confirm_required };
  }

  // Unknown actions require admin
  if (!hasAdminToken) {
    return {
      allowed: false,
      error: 'ADMIN_TOKEN required for unknown actions',
    };
  }

  return { allowed: true };
}

export function getActionEndpoint(action: string): string {
  const map: Record<string, string> = {
    'tools/get_status': '/health',
    'tools/get_metrics': '/metrics',
    'tools/get_orders': '/api/orders',
    'tools/get_positions': '/api/positions',
    'tools/get_alerts': '/api/alerts',
    'canary/run': '/canary/run',
    'backtest/run': '/api/backtest/start',
    'risk/threshold.set': '/api/risk/threshold',
    'model/promote': '/api/ml/promote',
    'model/downgrade': '/api/ml/downgrade',
    'strategy/stop': '/api/strategy/stop',
    'strategy/start': '/api/strategy/start',
  };

  return map[action] || '/api/unknown';
}

