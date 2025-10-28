export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  provider: string;
  fallback?: boolean;
}

export interface AIProvider {
  chat(input: string, context: string): Promise<AIResponse>;
}

export async function createAIProvider(type: 'manager' | 'strategy'): Promise<AIProvider> {
  const provider = process.env[`${type.toUpperCase()}_AI_PROVIDER`] || 'mock';
  
  switch (provider.toLowerCase()) {
    case 'openai':
      const { OpenAIProvider } = await import('./openai.js');
      return new OpenAIProvider();
    case 'anthropic':
      const { AnthropicProvider } = await import('./anthropic.js');
      return new AnthropicProvider();
    case 'mock':
    default:
      const { MockProvider } = await import('./mock.js');
      return new MockProvider();
  }
}

// --- MVP Strategy Generation API ---
export type GenerateInput = { symbol: string; risk: 'low'|'medium'|'high'; timeframe: string; provider?: 'mock'|'openai'|'auto' };
export type GenerateResult = { provider: string; strategy: any; tokenUsage?: number };

export type ProviderName = 'mock' | 'openai' | 'auto';

const AUTO_WEIGHTS = {
  mock: Number(process.env.AI_AUTO_WEIGHT_MOCK ?? 0.8),
  openai: Number(process.env.AI_AUTO_WEIGHT_OPENAI ?? 0.2),
};

function chooseAuto(): ProviderName {
  const r = Math.random();
  return r < AUTO_WEIGHTS.mock ? 'mock' : 'openai';
}

export async function aiGenerate(input: GenerateInput): Promise<GenerateResult> {
  const requested = (input.provider as ProviderName | undefined) ?? ((process.env.AI_PROVIDER || 'mock').toLowerCase() as ProviderName);
  const use: ProviderName = requested === 'auto' ? chooseAuto() : requested;
  if (use === 'openai' && process.env.OPENAI_API_KEY) {
    const { generateWithOpenAI } = await import('./openai');
    return generateWithOpenAI(input);
  }
  const { generateMock } = await import('./mock');
  return generateMock(input);
}