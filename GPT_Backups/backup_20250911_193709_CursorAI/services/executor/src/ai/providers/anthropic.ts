import type { AIProvider, AIResponse } from "./index";

export class AnthropicProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  async chat(input: string, context: string): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
        fallback: true,
        provider: 'anthropic'
      };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: `${context}\n\n${input}` }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        content: (data as any).content[0]?.text || 'No response content',
        provider: 'anthropic'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        provider: 'anthropic'
      };
    }
  }
} 