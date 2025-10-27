'use client';
import { useState, useCallback } from "react";
import { ChatMessage } from "../components/chat/ChatDock";

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
        ? 'Merhaba! Ben Yönetici AI. Grid/trend/scalp modları, risk yönetimi ve özet raporlar için yardımcı olabilirim.\n\nKomut örnekleri:\n• "grid\'e al" - Grid moduna geç\n• "trend moduna geç" - Trend takip moduna geç\n• "risk %0.5 yap" - Risk limitini ayarla\n• "gün sonu özeti" - Performans raporu al'
        : 'Merhaba! Ben Strateji AI. Doğal dilden strateji kodları üretebilir, backtest ve optimizasyon yapabilirim.\n\nKomut örnekleri:\n• "RSI+MACD stratejisi yaz" - Strateji şablonu oluştur\n• "backtest et" - Mevcut stratejiyi test et\n• "optimize et" - Parametreleri optimize et\n• "kaydet <ad>" - Stratejiyi kaydet'
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Komut ayrıştırma fonksiyonu - esnek eşleştirme
  const parseCommand = useCallback((text: string): { command: string; params: any } | null => {
    const lowerText = text.toLowerCase().trim();
    
    if (kind === 'manager') {
      // Manager AI komutları - esnek eşleştirme
      if (lowerText.includes('grid') || lowerText.includes('grid\'e al') || lowerText.includes('grid moduna geç')) {
        return { command: 'setMode', params: { mode: 'grid' } };
      }
      if (lowerText.includes('trend') || lowerText.includes('trend moduna geç') || lowerText.includes('trend takip')) {
        return { command: 'setMode', params: { mode: 'trend' } };
      }
      if (lowerText.includes('scalp') || lowerText.includes('scalp moduna geç') || lowerText.includes('scalping')) {
        return { command: 'setMode', params: { mode: 'scalp' } };
      }
      if (lowerText.includes('durdur') || lowerText.includes('stop') || lowerText.includes('duraklat')) {
        return { command: 'setMode', params: { mode: 'stopped' } };
      }
      if (lowerText.includes('başlat') || lowerText.includes('start') || lowerText.includes('resume')) {
        return { command: 'setMode', params: { mode: 'auto' } };
      }
      if (lowerText.includes('risk') && (lowerText.includes('%') || lowerText.includes('yüzde'))) {
        const match = lowerText.match(/risk.*?(\d+(?:\.\d+)?)/);
        if (match) {
          return { command: 'setRisk', params: { percent: parseFloat(match[1]) } };
        }
      }
      if (lowerText.includes('özet') || lowerText.includes('rapor') || lowerText.includes('summary')) {
        return { command: 'getSummary', params: {} };
      }
    } else {
      // Strategy AI komutları - esnek eşleştirme
      if (lowerText.includes('yaz') || lowerText.includes('strateji') || lowerText.includes('oluştur')) {
        return { command: 'generateStrategy', params: { description: text } };
      }
      if (lowerText.includes('backtest') || lowerText.includes('test et') || lowerText.includes('test')) {
        return { command: 'runBacktest', params: {} };
      }
      if (lowerText.includes('optimize') || lowerText.includes('optimize et') || lowerText.includes('iyileştir')) {
        return { command: 'runOptimize', params: { objective: 'sharpe' } };
      }
      if (lowerText.includes('kaydet') && (lowerText.includes('ad') || lowerText.includes('isim'))) {
        const match = lowerText.match(/kaydet\s+(.+)/);
        if (match) {
          return { command: 'saveStrategy', params: { name: match[1].trim() } };
        }
      }
    }
    
    return null;
  }, [kind]);

  // Tool-call fonksiyonları - 1500ms timeout
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
              const result = await modeResponse.json();
              return { 
                success: true, 
                data: { 
                  message: `${params.mode} moduna geçildi`,
                  source: result.source,
                  details: result.data
                } 
              };
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
              const result = await riskResponse.json();
              return { 
                success: true, 
                data: { 
                  message: `Risk %${params.percent} olarak ayarlandı`,
                  source: result.source,
                  details: result.data
                } 
              };
            }
            break;

          case 'getSummary':
            const summaryResponse = await fetch('/api/public/manager/summary', {
              signal: controller.signal
            });
            clearTimeout(timeout);
            if (summaryResponse.ok) {
              const result = await summaryResponse.json();
              return { success: true, data: result.data };
            }
            break;
        }
      } else {
        switch (command) {
          case 'generateStrategy':
            // Monaco editörüne şablon yazma (global state ile)
            const template = generateStrategyTemplate(params.description);
            return { 
              success: true, 
              data: { 
                template, 
                message: 'Strateji şablonu editöre yazıldı',
                details: { codeLength: template.length }
              } 
            };

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
              return { success: true, data: result.data };
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
              return { success: true, data: result.data };
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
              const result = await saveResponse.json();
              return { 
                success: true, 
                data: { 
                  message: `Strateji "${params.name}" kaydedildi`,
                  source: result.source,
                  details: result.data
                } 
              };
            }
            break;
        }
      }

      clearTimeout(timeout);
      return { success: false, error: 'Komut çalıştırılamadı' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      };
    }
  }, [kind]);

  // Strateji şablonu üretme - gelişmiş
  const generateStrategyTemplate = (description: string): string => {
    const template = `// RSI + MACD Stratejisi
// ${description}

//@version=5
strategy("RSI+MACD Strategy", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Parametreler
rsiLength = input.int(14, "RSI Periyodu", minval=1, maxval=100)
macdFast = input.int(12, "MACD Hızlı", minval=1, maxval=50)
macdSlow = input.int(26, "MACD Yavaş", minval=1, maxval=100)
macdSignal = input.int(9, "MACD Sinyal", minval=1, maxval=50)

// Göstergeler
rsi = ta.rsi(close, rsiLength)
[macdLine, signalLine, histLine] = ta.macd(close, macdFast, macdSlow, macdSignal)

// Alım koşulları
longCondition = rsi < 30 and macdLine > signalLine and macdLine > 0

// Satım koşulları
shortCondition = rsi > 70 and macdLine < signalLine and macdLine < 0

// Strateji
if longCondition
    strategy.entry("Long", strategy.long, comment="RSI+MACD Alım")

if shortCondition
    strategy.entry("Short", strategy.short, comment="RSI+MACD Satım")

// Stop Loss ve Take Profit
strategy.exit("Exit Long", "Long", stop=strategy.position_avg_price * 0.98, limit=strategy.position_avg_price * 1.03)
strategy.exit("Exit Short", "Short", stop=strategy.position_avg_price * 1.02, limit=strategy.position_avg_price * 0.97)

// Plot
plot(rsi, "RSI", color=color.blue, display=display.none)
plot(macdLine, "MACD", color=color.orange, display=display.none)
plot(signalLine, "Signal", color=color.red, display=display.none)`;
    
    return template;
  };

  // Mesaj gönderme - gelişmiş
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
      
      let toolContent = '';
      if (result.success) {
        if (result.data?.message) {
          toolContent = `✅ ${result.data.message}`;
        } else if (result.data?.template) {
          toolContent = `✅ Strateji şablonu oluşturuldu\nKod Uzunluğu: ${result.data.details?.codeLength || 0} karakter`;
        } else if (result.data?.performance) {
          toolContent = `📈 Backtest Sonuçları:\nP&L: $${result.data.performance.pnl?.toFixed(2) || 'N/A'}\nKazanma Oranı: %${(result.data.performance.winRate * 100)?.toFixed(1) || 'N/A'}\nSharpe Ratio: ${result.data.performance.sharpe?.toFixed(2) || 'N/A'}`;
        } else {
          toolContent = `✅ Komut başarıyla çalıştırıldı`;
        }
      } else {
        toolContent = `❌ Hata: ${result.error}`;
      }

      const toolMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'tool',
        content: toolContent,
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