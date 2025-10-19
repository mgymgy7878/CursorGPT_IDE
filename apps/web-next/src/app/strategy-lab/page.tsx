"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import StatusPills from "@/components/layout/StatusPills";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/button";

function AIForm() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult(`Strateji oluşturuldu: ${prompt}`);
    } catch (error) {
      console.error('Strategy generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card title="AI Strategy Generation">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">AI Model</label>
          <select className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
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
            className="w-full min-h-[160px] px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Başlamak için bir strateji isteği yazın. Örnek: BTCUSDT 1h EMA crossover stratejisi..."
            disabled={isGenerating}
          />
        </div>
        {result && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-green-400 font-medium mb-2">Oluşturulan Strateji:</h4>
            <p className="text-green-300 text-sm">{result}</p>
          </div>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? '⏳ Oluşturuluyor...' : '🤖 AI ile Strateji Üret'}
        </Button>
      </div>
    </Card>
  );
}

function BacktestPane() {
  return (
    <Card title="Backtest Configuration">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Asset</label>
            <input type="text" defaultValue="BTCUSDT" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Timeframe</label>
            <select className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
              <option>1h</option>
              <option>4h</option>
              <option>1d</option>
            </select>
          </div>
        </div>
        <Button className="w-full">🚀 Backtest Çalıştır</Button>
      </div>
    </Card>
  );
}

function OptimizePane() {
  return (
    <Card title="Parameter Optimization">
      <div className="space-y-4">
        <div className="text-sm text-neutral-400">Optimize edilecek parametreleri seçin.</div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
            <input type="checkbox" defaultChecked className="rounded" />
            <div className="flex-1">
              <div className="text-sm font-medium">EMA Fast Period</div>
              <div className="text-xs text-neutral-400">Range: 5-50</div>
            </div>
          </div>
        </div>
        <Button className="w-full">⚙️ Optimizasyon Başlat</Button>
      </div>
    </Card>
  );
}

function BestOfPane() {
  return (
    <Card title="Best-of Results">
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-neutral-400 mb-2">Henüz optimizasyon sonucu yok</div>
        </div>
        <Button className="w-full" variant="success">💾 Best Variant'ı Kaydet</Button>
      </div>
    </Card>
  );
}

export default function StrategyLab() {
  return (
    <AppShell>
      <PageHeader
        title="Strategy Lab"
        subtitle="AI → Backtest → Optimize → Best-of"
      />
      
      <div className="mb-4">
        <StatusPills env="Mock" feed="Healthy" broker="Offline" />
      </div>

      <div className="space-y-4">
        
        {/* Sticky tab bar */}
        <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-3">
          <Tabs defaultValue="ai">
            <TabsList className="font-medium">
              <TabsTrigger value="ai">AI Strategy</TabsTrigger>
              <TabsTrigger value="backtest">Backtest</TabsTrigger>
              <TabsTrigger value="opt">Optimize</TabsTrigger>
              <TabsTrigger value="best">Best-of</TabsTrigger>
            </TabsList>
            <TabsContent value="ai"><AIForm/></TabsContent>
            <TabsContent value="backtest"><BacktestPane/></TabsContent>
            <TabsContent value="opt"><OptimizePane/></TabsContent>
            <TabsContent value="best"><BestOfPane/></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}