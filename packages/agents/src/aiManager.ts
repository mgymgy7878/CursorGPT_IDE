import { EchoLLM, type LLMClient, type ChatMessage } from "./llm";

export type ManagerState = 'idle'|'monitoring'|'deciding'|'executing'|'cooldown'|'emergency_stop';
export type Decision = { action: 'LONG'|'SHORT'|'FLAT'; size: number; reason: string; ts: number; symbol: string };

export type AIManagerConfig = { cooldownMs: number; enabled: boolean };
export type AIManagerStats = { state: ManagerState; lastDecision?: Decision; decisions: number; running: boolean };

export class AIManager {
  private state: ManagerState = 'idle';
  private cfg: AIManagerConfig = { cooldownMs: 10_000, enabled: false };
  private cooldownUntil = 0;
  private _running = false;
  private _decisions = 0;
  private _last?: Decision;
  public onDecision?: (d: Decision) => void;

  constructor(private llm: LLMClient = new EchoLLM(), private logger?: { info?: (...args: any[]) => void }) {}

  toggle(run?: boolean) {
    this._running = typeof run === 'boolean' ? run : !this._running;
    this.state = this._running ? 'monitoring' : 'idle';
    return this._running;
  }

  config(next?: Partial<AIManagerConfig>) {
    if (next) this.cfg = { ...this.cfg, ...next };
    return this.cfg;
  }

  stats(): AIManagerStats {
    return { state: this.state, lastDecision: this._last, decisions: this._decisions, running: this._running };
  }

  async tick(marketCtx: { symbol: string; timeframe: string; price: number; signals?: Record<string, number> }) {
    if (!this._running || this.state === 'emergency_stop') return;
    const now = Date.now();
    if (now < this.cooldownUntil) { this.state = 'cooldown'; return; }

    this.state = 'deciding';
    const text = `Fiyat=${marketCtx.price}, sembol=${marketCtx.symbol}. LONG mu SHORT mu FLAT mi ve neden?`;
    const res = await this.llm.chat([
      { role: 'system', content: 'Sen temkinli bir AI trade yöneticisisin; risk limitlerini aşma.' },
      { role: 'user', content: text }
    ] as ChatMessage[]);
    const up = res.text.toUpperCase();
    const action: Decision['action'] =
      up.includes('LONG') ? 'LONG' : up.includes('SHORT') ? 'SHORT' : 'FLAT';

    const d: Decision = { action, size: 1, reason: res.text.slice(0, 200), ts: now, symbol: marketCtx.symbol };
    this._last = d; this._decisions++; this.state = 'executing';
    this.onDecision?.(d);
    try { this.logger?.info?.('AI decision', d as any); } catch {}

    this.cooldownUntil = now + this.cfg.cooldownMs;
    this.state = 'monitoring';
  }
} 