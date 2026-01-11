/**
 * LLM Provider Interface
 *
 * Abstraction layer for LLM providers (OpenAI, Anthropic, etc.)
 * Supports streaming and non-streaming responses.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamChunk {
  type: 'token' | 'done';
  content?: string;
  done?: boolean;
}

export interface LLMProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  /**
   * Stream a chat completion
   */
  streamChat(
    messages: LLMMessage[],
    config?: LLMProviderConfig
  ): AsyncIterable<LLMStreamChunk>;

  /**
   * Non-streaming chat completion
   */
  chat(
    messages: LLMMessage[],
    config?: LLMProviderConfig
  ): Promise<string>;

  /**
   * Get available models
   */
  getModels(): string[];
}

