export type ChatMessage = { role: 'system'|'user'|'assistant'; content: string };

export interface LLMClient {
  chat(messages: ChatMessage[]): Promise<{ text: string }>;
}

export class EchoLLM implements LLMClient {
  async chat(messages: ChatMessage[]): Promise<{ text: string }> {
    const last = messages[messages.length - 1];
    return { text: `ECHO: ${last?.content ?? ''}` };
  }
}

export class DummyLLM implements LLMClient {
  async chat(messages: ChatMessage[]): Promise<{ text: string }> {
    const last = messages[messages.length - 1];
    return { text: `DUMMY_RESPONSE: ${(last?.content ?? '').slice(0, 64)}...` };
  }
} 