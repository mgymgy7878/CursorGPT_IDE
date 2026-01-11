/**
 * OpenAI Provider Implementation
 *
 * Implements LLMProvider interface for OpenAI API.
 * Supports streaming via SSE.
 */

import type { LLMProvider, LLMMessage, LLMStreamChunk, LLMProviderConfig } from './LLMProvider.js';

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config?: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config?.defaultModel || 'gpt-4o-mini';

    if (!this.apiKey) {
      console.warn('⚠️  OpenAI API key not found. Set OPENAI_API_KEY env var.');
    }
  }

  async *streamChat(
    messages: LLMMessage[],
    config?: LLMProviderConfig
  ): AsyncIterable<LLMStreamChunk> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = config?.model || this.defaultModel;
    const temperature = config?.temperature ?? 0.7;
    const maxTokens = config?.maxTokens ?? 1000;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done', done: true };
              return;
            }

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta;
              if (delta?.content) {
                yield {
                  type: 'token',
                  content: delta.content,
                };
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done', done: true };
  }

  async chat(
    messages: LLMMessage[],
    config?: LLMProviderConfig
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = config?.model || this.defaultModel;
    const temperature = config?.temperature ?? 0.7;
    const maxTokens = config?.maxTokens ?? 1000;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    return data.choices?.[0]?.message?.content || '';
  }

  getModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ];
  }
}

