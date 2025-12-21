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
                className="w-full min-h-[160px] px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Başlamak için bir strateji isteği yazın. Örnek: BTCUSDT 1h EMA crossover stratejisi..."
                disabled={isGenerating}
              />
            </div>
            <Button
              onClick={() => setIsGenerating(true)}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? '⏳ Oluşturuluyor...' : '🤖 AI ile Strateji Üret'}
            </Button>
          </div>
        </Surface>
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

