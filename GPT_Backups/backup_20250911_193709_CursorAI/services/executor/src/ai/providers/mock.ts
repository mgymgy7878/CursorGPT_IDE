import type { AIProvider, AIResponse } from "./index";

export class MockProvider implements AIProvider {
  async chat(input: string, context: string): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock responses based on input keywords
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('piyasa') || lowerInput.includes('özet')) {
      return {
        success: true,
        content: `📊 Piyasa Özeti (Mock):\n\nBTC/USDT: $43,250 (+2.3%)\nETH/USDT: $2,680 (+1.8%)\n\nTrend: Yükseliş modunda\nVolatilite: Orta seviye\nÖnerilen Mod: trend\nRisk: %0.5`,
        provider: 'mock'
      };
    }

    if (lowerInput.includes('rsi') || lowerInput.includes('strateji')) {
      return {
        success: true,
        content: `// RSI Tabanlı Strateji (Mock)
function rsiStrategy(data) {
  const rsi = calculateRSI(data.close, 14);
  
  if (rsi < 30) {
    return { action: 'BUY', reason: 'RSI oversold' };
  } else if (rsi > 70) {
    return { action: 'SELL', reason: 'RSI overbought' };
  }
  
  return { action: 'HOLD', reason: 'RSI neutral' };
}`,
        provider: 'mock'
      };
    }

    if (lowerInput.includes('risk') || lowerInput.includes('güvenlik')) {
      return {
        success: true,
        content: `🔒 Risk Yönetimi (Mock):\n\nMevcut Risk: %0.5\nÖnerilen: %0.3-%0.7 arası\n\nStop Loss: %2.0\nTake Profit: %5.0\n\nPortfolio Dağılımı:\n- BTC: %60\n- ETH: %30\n- Cash: %10`,
        provider: 'mock'
      };
    }

    // Default response
    return {
      success: true,
      content: `🤖 Mock AI Yanıtı:\n\n"${input}" komutu için mock yanıt.\n\nGerçek AI entegrasyonu için API key'lerini ayarlayın:\n- OPENAI_API_KEY\n- ANTHROPIC_API_KEY`,
      provider: 'mock'
    };
  }
} 