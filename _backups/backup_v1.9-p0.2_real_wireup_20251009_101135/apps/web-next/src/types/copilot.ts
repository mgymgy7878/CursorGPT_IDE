// Copilot Type Definitions
export type MessageRole = 'user' | 'assistant' | 'event' | 'system';

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ActionJSON {
  action: string;
  params: Record<string, any>;
  dryRun: boolean;
  confirm_required: boolean;
  reason: string;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  needsConfirm?: boolean;
  dryRunResult?: any;
}

export interface LiveStatus {
  health: 'healthy' | 'degraded' | 'down';
  metrics: {
    p95_ms: number;
    error_rate: number;
    psi: number;
    match_rate: number;
  };
  openOrders: number;
  positions: number;
  timestamp: number;
}

export interface SlashCommand {
  command: string;
  description: string;
  example: string;
  requiresAdmin: boolean;
}

