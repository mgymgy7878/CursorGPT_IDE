'use client';
import { useState, useCallback } from "react";
import { ChatMessage } from "./ChatDock";

interface UseChatDockProps {
  kind: 'manager' | 'strategy';
}

interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function useChatDock({ kind }: UseChatDockProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: kind === 'manager' 
        ? 'Merhaba! Ben Yönetici AI. Grid/trend/scalp modları, risk yönetimi ve özet raporlar için yardımcı olabilirim.'
        : 'Merhaba! Ben Strateji AI. Doğal dilden strateji kodları üretebilir, backtest ve optimizasyon yapabilirim.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Komut ayrıştırma fonksiyonu
  const parseCommand = useCallback((text: string): { command: string; params: any } | null => {
    const lowerText = text.toLowerCase().trim();
    
    if (kind === 'manager') {
      // Manager AI komutları
      if (lowerText.includes('grid') || lowerText.includes('grid\'e al')) {
        return { command: 'setMode', params: { mode: 'grid' } };
      }
      if (lowerText.includes('trend') || lowerText.includes('trend moduna geç')) {
        return { command: 'setMode', params: { mode: 'trend' } };
      }
      if (lowerText.includes('scalp') || lowerText.includes('scalp moduna geç')) {
        return { command: 'setMode', params: { mode: 'scalp' } };
      }
      if (lowerText.includes('durdur') || lowerText.includes('stop')) {
        return { command: 'setMode', params: { mode: 'stopped' } };
      }
      if (lowerText.includes('başlat') || lowerText.includes('start')) {
        return { command: 'setMode', params: { mode: 'auto' } };
      }
      if (lowerText.includes('risk') && lowerText.includes('%')) {
        const match = lowerText.match(/risk.*?(\d+(?:\.\d+)?)/);
        if (match) {
          return { command: 'setRisk', params: { percent: parseFloat(match[1]) } };
        }
      }
      if (lowerText.includes('özet') || lowerText.includes('rapor')) {
        return { command: 'getSummary', params: {} };
      }
    } else {
      // Strategy AI komutları
      if (lowerText.includes('yaz') || lowerText.includes('strateji')) {
        return { command: 'generateStrategy', params: { description: text } };
      }
      if (lowerText.includes('backtest') || lowerText.includes('test et')) {
        return { command: 'runBacktest', params: {} };
      }
      if (lowerText.includes('optimize') || lowerText.includes('optimize et')) {
        return { command: 'runOptimize', params: { objective: 'sharpe' } };
      }
      if (lowerText.includes('kaydet') && lowerText.includes('ad')) {
        const match = lowerText.match(/kaydet\s+(.+)/);
        if (match) {
          return { command: 'saveStrategy', params: { name: match[1].trim() } };
        }
      }
    }
    
    return null;
  }, [kind]);

  // Tool-call fonksiyonları
  const executeToolCall = useCallback(async (command: string, params: any): Promise<ToolCallResult> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      if (kind === 'manager') {
        switch (command) {
          case 'setMode':
            const modeResponse = await fetch('/api/public/strategy/mode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (modeResponse.ok) {
              return { success: true, data: { message: `${params.mode} moduna geçildi` } };
            }
            break;

          case 'setRisk':
            const riskResponse = await fetch('/api/public/risk/set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (riskResponse.ok) {
              return { success: true, data: { message: `Risk %${params.percent} olarak ayarlandı` } };
            }
            break;

          case 'getSummary':
            const summaryResponse = await fetch('/api/public/manager/summary', {
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (summaryResponse.ok) {
              const summary = await summaryResponse.json();
              return { success: true, data: summary };
            }
            break;
        }
      } else {
        switch (command) {
          case 'generateStrategy':
            // Monaco editörüne şablon yazma (global state ile)
            const template = generateStrategyTemplate(params.description);
            return { success: true, data: { template, message: 'Strateji şablonu editöre yazıldı' } };

          case 'runBacktest':
            const backtestResponse = await fetch('/api/public/lab/backtest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol: 'BTCUSDT', timeframe: '15m' }),
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (backtestResponse.ok) {
              const result = await backtestResponse.json();
              return { success: true, data: result };
            }
            break;

          case 'runOptimize':
            const optimizeResponse = await fetch('/api/public/lab/optimize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...params, symbol: 'BTCUSDT', timeframe: '15m' }),
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (optimizeResponse.ok) {
              const result = await optimizeResponse.json();
              return { success: true, data: result };
            }
            break;

          case 'saveStrategy':
            const saveResponse = await fetch('/api/public/lab/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (saveResponse.ok) {
              return { success: true, data: { message: `Strateji "${params.name}" kaydedildi` } };
            }
            break;
        }
      }

      clearTimeout(timeout);
      return { success: false, error: 'Komut çalıştırılamadı' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' };
    }
  }, [kind]);

  // Strateji şablonu üretme
  const generateStrategyTemplate = (description: string): string => {
    const template = `// RSI + MACD Stratejisi
// ${description}

//@version=5
strategy("RSI+MACD Strategy", overlay=true)

// Parametreler
rsiLength = input(14, "RSI Periyodu")
macdFast = input(12, "MACD Hızlı")
macdSlow = input(26, "MACD Yavaş")
macdSignal = input(9, "MACD Sinyal")

// Göstergeler
rsi = ta.rsi(close, rsiLength)
[macdLine, signalLine, histLine] = ta.macd(close, macdFast, macdSlow, macdSignal)

// Alım koşulları
longCondition = rsi < 30 and macdLine > signalLine

// Satım koşulları
shortCondition = rsi > 70 and macdLine < signalLine

// Strateji
if longCondition
    strategy.entry("Long", strategy.long)

if shortCondition
    strategy.entry("Short", strategy.short)

// Plot
plot(rsi, "RSI", color=color.blue)
plot(macdLine, "MACD", color=color.orange)
plot(signalLine, "Signal", color=color.red)`;
    
    return template;
  };

  // Mesaj gönderme
  const handleSend = useCallback(async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      meta: { page: kind === 'manager' ? 'dashboard' : 'strategy-lab', ts: new Date().toISOString() }
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Komut ayrıştırma
    const parsed = parseCommand(text);
    
    if (parsed) {
      // Tool-call çalıştırma
      const result = await executeToolCall(parsed.command, parsed.params);
      
      const toolMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'tool',
        content: result.success 
          ? `✅ ${result.data?.message || 'Komut başarıyla çalıştırıldı'}`
          : `❌ Hata: ${result.error}`,
        meta: { 
          page: kind === 'manager' ? 'dashboard' : 'strategy-lab',
          tool: parsed.command,
          ts: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, toolMessage]);
    } else {
      // AI yanıtı (mock)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: kind === 'manager'
          ? 'Anlamadım. "grid\'e al", "trend moduna geç", "risk %0.5 yap" veya "gün sonu özeti" gibi komutları deneyebilirsiniz.'
          : 'Anlamadım. "RSI+MACD stratejisi yaz", "backtest et", "optimize et" veya "kaydet <ad>" gibi komutları deneyebilirsiniz.',
        meta: { 
          page: kind === 'manager' ? 'dashboard' : 'strategy-lab',
          ts: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    }

    setLoading(false);
  }, [kind, parseCommand, executeToolCall]);

  return {
    messages,
    loading,
    handleSend
  };
} 