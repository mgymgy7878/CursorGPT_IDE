// Slash Command Parser
import type { ActionJSON, SlashCommand } from '@/types/copilot';

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/health',
    description: 'Sistem sağlık durumu',
    example: '/health',
    requiresAdmin: false,
  },
  {
    command: '/metrics',
    description: 'Performans metrikleri',
    example: '/metrics',
    requiresAdmin: false,
  },
  {
    command: '/orders',
    description: 'Açık emirler',
    example: '/orders',
    requiresAdmin: false,
  },
  {
    command: '/positions',
    description: 'Açık pozisyonlar',
    example: '/positions',
    requiresAdmin: false,
  },
  {
    command: '/backtest',
    description: 'Backtest çalıştır (dry)',
    example: '/backtest btcusdt 15m sma:10,20',
    requiresAdmin: false,
  },
  {
    command: '/stop',
    description: 'Strateji durdur',
    example: '/stop strat meanrev-01',
    requiresAdmin: true,
  },
  {
    command: '/start',
    description: 'Strateji başlat',
    example: '/start strat meanrev-01',
    requiresAdmin: true,
  },
  {
    command: '/closeall',
    description: 'Tüm pozisyonları kapat (tehlikeli)',
    example: '/closeall',
    requiresAdmin: true,
  },
  {
    command: '/strat new',
    description: 'Yeni strateji taslağı oluştur',
    example: '/strat new rsi tf:15m sym:BTCUSDT',
    requiresAdmin: false,
  },
  {
    command: '/strat backtest',
    description: 'Strateji backtest (dry-run)',
    example: '/strat backtest id:demo-rsi seed:42',
    requiresAdmin: false,
  },
  {
    command: '/strat optimize',
    description: 'Parametre optimizasyonu önerisi',
    example: '/strat optimize id:demo-rsi space:grid',
    requiresAdmin: false,
  },
];

export function parseSlash(input: string): ActionJSON | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case '/health':
      return {
        action: 'tools/get_status',
        params: {},
        dryRun: true,
        confirm_required: false,
        reason: 'quick health check',
      };

    case '/metrics':
      return {
        action: 'tools/get_metrics',
        params: {},
        dryRun: true,
        confirm_required: false,
        reason: 'metrics summary',
      };

    case '/orders':
      return {
        action: 'tools/get_orders',
        params: {},
        dryRun: true,
        confirm_required: false,
        reason: 'list open orders',
      };

    case '/positions':
      return {
        action: 'tools/get_positions',
        params: {},
        dryRun: true,
        confirm_required: false,
        reason: 'list open positions',
      };

    case '/backtest': {
      const symbol = args[0] || 'BTCUSDT';
      const timeframe = args[1] || '15m';
      const strategy = args[2] || 'sma:10,20';
      const [stratName, stratArgs] = strategy.split(':');
      const [fast, slow] = (stratArgs || '10,20').split(',').map(Number);

      return {
        action: 'canary/run',
        params: {
          symbol,
          timeframe,
          strategy: stratName,
          args: { fast, slow },
        },
        dryRun: true,
        confirm_required: false,
        reason: 'user backtest dry run',
      };
    }

    case '/stop': {
      const strategyId = args.join(' ') || 'unknown';
      return {
        action: 'strategy/stop',
        params: { strategyId, state: 'paused' },
        dryRun: true,
        confirm_required: true,
        reason: 'pause strategy',
      };
    }

    case '/start': {
      const strategyId = args.join(' ') || 'unknown';
      return {
        action: 'strategy/start',
        params: { strategyId, state: 'running' },
        dryRun: true,
        confirm_required: true,
        reason: 'start strategy',
      };
    }

    case '/closeall':
      return {
        action: 'trade/closeall',
        params: {},
        dryRun: true,
        confirm_required: true,
        reason: 'dangerous bulk close all positions',
      };

    case '/strat': {
      const subCommand = args[0];
      
      if (subCommand === 'new') {
        // Parse: /strat new rsi tf:15m sym:BTCUSDT
        const family = args[1] || 'sma';
        const params: any = { family };
        
        args.slice(2).forEach(arg => {
          const [key, val] = arg.split(':');
          if (key && val) params[key] = val;
        });

        return {
          action: 'advisor/suggest',
          params: {
            topic: 'new_strategy',
            spec: { 
              family: params.family || family,
              tf: params.tf || '15m',
              symbol: params.sym || 'BTCUSDT'
            },
          },
          dryRun: true,
          confirm_required: false,
          reason: 'draft strategy',
        };
      }

      if (subCommand === 'backtest') {
        // Parse: /strat backtest id:demo-rsi seed:42
        const params: any = {};
        args.slice(1).forEach(arg => {
          const [key, val] = arg.split(':');
          if (key && val) params[key] = val;
        });

        return {
          action: 'canary/run',
          params: {
            symbol: 'BTCUSDT',
            tf: '15m',
            strategy: params.id || 'demo',
            args: {},
            seed: params.seed ? Number(params.seed) : undefined,
          },
          dryRun: true,
          confirm_required: false,
          reason: 'backtest dry',
        };
      }

      if (subCommand === 'optimize') {
        // Parse: /strat optimize id:demo-rsi space:grid
        const params: any = {};
        args.slice(1).forEach(arg => {
          const [key, val] = arg.split(':');
          if (key && val) params[key] = val;
        });

        return {
          action: 'advisor/suggest',
          params: {
            topic: 'optimize',
            id: params.id || 'unknown',
            space: params.space || 'grid',
          },
          dryRun: true,
          confirm_required: false,
          reason: 'param search proposal',
        };
      }

      return null;
    }

    default:
      return null;
  }
}

