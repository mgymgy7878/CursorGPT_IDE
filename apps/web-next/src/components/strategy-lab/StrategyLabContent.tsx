/**
 * StrategyLabContent - Tabbed content panels
 *
 * Figma parity: AI / Backtest / Optimize / Best-of panels
 */

'use client';

import { useState } from 'react';
import { Surface } from '@/components/ui/Surface';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StrategyLabState = 'default' | 'loading' | 'empty' | 'error';

interface StrategyLabContentProps {
  activeTab: 'ai' | 'backtest' | 'optimize' | 'best-of';
  state?: StrategyLabState;
}

export default function StrategyLabContent({ activeTab, state = 'default' }: StrategyLabContentProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (state === 'loading') {
    return <SkeletonBlock variant="form" />;
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title="No data available"
        description="Content will appear here when available"
      />
    );
  }

  if (state === 'error') {
    return (
      <EmptyState
        title="Error loading content"
        description="Please try again later"
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  // Default state with content
  switch (activeTab) {
    case 'ai':
      return (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          {/* Sol: Input alanı */}
          <Surface variant="card" className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">AI Model</label>
                <select className="w-full h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:border-blue-500 focus:outline-none">
                  <option>OpenAI GPT-4</option>
                  <option>Anthropic Claude</option>
                  <option>Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Strategy Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none resize-none overflow-auto glance-textarea"
                  placeholder="Başlamak için bir strateji isteği yazın. Örnek: BTCUSDT 1h EMA crossover stratejisi..."
                  disabled={isGenerating}
                />
              </div>

              {/* PATCH 6: Prompt Presets */}
              <div>
                <div className="text-xs font-medium text-neutral-400 mb-2">Hızlı Şablonlar</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'EMA Cross', prompt: 'BTCUSDT 1h EMA crossover stratejisi' },
                    { label: 'RSI Mean Rev', prompt: 'ETHUSDT 4h RSI mean reversion stratejisi' },
                    { label: 'Breakout ATR', prompt: 'SOLUSDT 1h ATR breakout stratejisi' },
                    { label: 'Trend Follow', prompt: 'BTCUSDT 1D trend following stratejisi' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setPrompt(preset.prompt)}
                      className="px-2.5 py-1 text-[10px] font-medium rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PATCH 6: Son kullanılan promptlar */}
              {prompt && (
                <div>
                  <div className="text-xs font-medium text-neutral-400 mb-2">Son Kullanılanlar</div>
                  <div className="space-y-1">
                    {[
                      'BTCUSDT 1h EMA crossover stratejisi',
                      'ETHUSDT 4h RSI mean reversion',
                    ].map((recent, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(recent)}
                        className="w-full text-left px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                      >
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsGenerating(true)}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? '⏳ Oluşturuluyor...' : '🤖 AI ile Strateji Üret'}
              </Button>

              {/* PATCH 6: Estimated run (backtest step'e geçmeden önce) */}
              {prompt && !isGenerating && (
                <div className="pt-3 border-t border-neutral-800">
                  <div className="text-xs text-neutral-400">
                    Tahmini çalışma süresi: ~2-3 dakika (backtest dahil)
                  </div>
                </div>
              )}
            </div>
          </Surface>

          {/* Sağ: Preview Panel */}
          <Surface variant="card" className="p-4">
            <div className="text-xs font-medium text-neutral-300 mb-3">Generated Strategy Summary</div>
            {prompt ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-neutral-400 mb-1">Entry Rules</div>
                  <div className="text-xs text-neutral-300 p-2 rounded bg-neutral-900/50 border border-neutral-800">
                    {prompt.includes('EMA') ? 'EMA(12) > EMA(26)' :
                     prompt.includes('RSI') ? 'RSI < 30 (oversold)' :
                     prompt.includes('ATR') ? 'Price > ATR(14) * 1.5' :
                     'Trend following signals'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 mb-1">Exit Rules</div>
                  <div className="text-xs text-neutral-300 p-2 rounded bg-neutral-900/50 border border-neutral-800">
                    Take profit: +5% | Stop loss: -2%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 mb-1">Risk</div>
                  <div className="text-xs text-neutral-300 p-2 rounded bg-neutral-900/50 border border-neutral-800">
                    Max position: 10% | Leverage: 2x
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 mb-1">Data</div>
                  <div className="text-xs text-neutral-300 p-2 rounded bg-neutral-900/50 border border-neutral-800">
                    {prompt.match(/BTCUSDT|ETHUSDT|SOLUSDT/) ? prompt.match(/BTCUSDT|ETHUSDT|SOLUSDT/)![0] : 'BTCUSDT'} · 1h
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-500 text-center py-8">
                Prompt yazınca önizleme burada görünecek
              </div>
            )}
          </Surface>
        </div>
      );

    case 'backtest':
      return (
        <Surface variant="card" className="p-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Asset</label>
                <Input value="BTCUSDT" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Timeframe</label>
                <select className="w-full h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:border-blue-500 focus:outline-none">
                  <option>1h</option>
                  <option>4h</option>
                  <option>1d</option>
                </select>
              </div>
            </div>
            <Button className="w-full">🚀 Backtest Çalıştır</Button>
          </div>
        </Surface>
      );

    case 'optimize':
      return (
        <Surface variant="card" className="p-6">
          <div className="space-y-4">
            <div className="text-sm text-neutral-400">Optimize edilecek parametreleri seçin.</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <input type="checkbox" defaultChecked className="rounded" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-200">EMA Fast Period</div>
                  <div className="text-xs text-neutral-400">Range: 5-50</div>
                </div>
              </div>
            </div>
            <Button className="w-full">⚙️ Optimizasyon Başlat</Button>
          </div>
        </Surface>
      );

    case 'best-of':
      return (
        <Surface variant="card" className="p-6">
          <div className="space-y-4">
            <EmptyState
              title="Henüz optimizasyon sonucu yok"
              description="Optimizasyon tamamlandığında en iyi variant burada görünecek"
              icon="⭐"
            />
            <Button className="w-full" variant="default">💾 Best Variant'ı Kaydet</Button>
          </div>
        </Surface>
      );

    default:
      return null;
  }
}

