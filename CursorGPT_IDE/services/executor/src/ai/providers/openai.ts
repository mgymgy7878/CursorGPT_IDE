import type { AIProvider, AIResponse } from "./index";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  async chat(input: string, context: string): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OPENAI_API_KEY not configured',
        fallback: true,
        provider: 'openai'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: input }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        content: (data as any).choices[0]?.message?.content || 'No response content',
        provider: 'openai'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        provider: 'openai'
      };
    }
  }
}

// --- MVP Strategy Generation (OpenAI placeholder with timeout/retry) ---
import type { GenerateInput } from '../schema';

// Tuning knobs (env-overridable)
const OPENAI_TIMEOUT_MS = 20_000;
const OPENAI_MAX_RETRIES = Number(process.env.AI_OPENAI_RETRIES ?? 1);
const BREAKER_WINDOW_MS = Number(process.env.AI_OPENAI_BREAKER_WINDOW_MS ?? 90_000);
let recentFailures = 0;
let lastFailAt = 0;

async function withTimeout<T>(p: Promise<T>, ms = OPENAI_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v)=>{ clearTimeout(t); resolve(v); })
     .catch((e)=>{ clearTimeout(t); reject(e); });
  });
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let err: any;
  for (let i=0;i<=OPENAI_MAX_RETRIES;i++) {
    try { return await withTimeout(fn()); }
    catch (e) { err = e; await new Promise(r=> setTimeout(r, 250*Math.pow(2,i) + Math.random()*100)); }
  }
  throw err;
}

export async function generateWithOpenAI(input: GenerateInput): Promise<{ provider: string; strategy: any; tokenUsage?: number }>{
  const since = Date.now() - lastFailAt;
  if (recentFailures >= 3 && since < BREAKER_WINDOW_MS) {
    throw new Error('breaker_open');
  }
  try {
    // TODO: real client; placeholder returns deterministic shape
    const strategy = { name:'ema_atr_v1', symbol: (input as any).pair || (input as any).symbol, timeframe: (input as any).tf || (input as any).timeframe, ema_fast:9, ema_slow:21, atr:14, sl_atr:1.5, tp_atr:2, leverage:5, notes:'openai placeholder' };
    const result = await withRetry(async ()=> strategy);
    return { provider:'openai', strategy: result, tokenUsage: 200 };
  } catch (e) {
    recentFailures++; lastFailAt = Date.now(); throw e as any;
  } finally {
    if (Date.now() - lastFailAt > BREAKER_WINDOW_MS) recentFailures = 0;
  }
} 