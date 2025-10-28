import { createAIProvider } from "./providers/index.js";
import type { AIProvider } from "./providers/index.js";

const MANAGER_CONTEXT = `Sen bir trading platform yönetici AI'sısın. Piyasa analizi, risk yönetimi ve strateji modları hakkında bilgi ver. Yanıtların kısa ve öz olsun.`;

const STRATEGY_CONTEXT = `Sen bir trading strateji geliştirici AI'sısın. JavaScript/TypeScript kod üret. Stratejiler fonksiyon olarak dönsün ve data parametresi alsın. Kod açıklamalı olsun.`;

class AIService {
  private managerAI!: AIProvider;
  private strategyAI!: AIProvider;

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    this.managerAI = await createAIProvider('manager');
    this.strategyAI = await createAIProvider('strategy');
  }

  async managerChat(input: string): Promise<any> {
    const response = await this.managerAI.chat(input, MANAGER_CONTEXT);
    return {
      ok: response.success,
      content: response.content,
      provider: response.provider,
      error: response.error
    };
  }

  async strategyChat(input: string): Promise<any> {
    const response = await this.strategyAI.chat(input, STRATEGY_CONTEXT);
    return {
      ok: response.success,
      content: response.content,
      provider: response.provider,
      error: response.error
    };
  }
}

export const aiService = new AIService(); 