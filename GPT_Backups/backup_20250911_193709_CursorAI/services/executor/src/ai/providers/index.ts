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