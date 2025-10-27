'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { SafeBoundary } from "@/components/SafeBoundary";
import CodeEditor from "./CodeEditor";
import BacktestPanel from "./BacktestPanel";
import OptimizePanel from "./OptimizePanel";
import ResultsPanel from "./ResultsPanel";
import SavedStrategies from "./SavedStrategies";

type Tab = 'editor' | 'backtest' | 'optimize' | 'results';

export default function StrategyWorkspace() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = (sp?.get('tab') as Tab) || 'editor';
  
  const setTab = useCallback((t: Tab) => {
    router.push(`/strategy-lab?tab=${t}`);
  }, [router]);

  const [code, setCode] = useState('// buy if rsi<30; sell if rsi>70;');

  const onUseStrategy = useCallback((s: { name: string; code: string }) => {
    setCode(s.code);
    setTab('editor');
  }, [setTab]);

  return (
    <SafeBoundary>
      <div className="grid grid-cols-1 gap-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {(['editor', 'backtest', 'optimize', 'results'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t)}
            >
              {t === 'editor' && 'Editör'}
              {t === 'backtest' && 'Backtest'}
              {t === 'optimize' && 'Optimize'}
              {t === 'results' && 'Sonuçlar'}
            </button>
          ))}
        </div>

        {/* Main area */}
        {tab === 'editor' && <CodeEditor value={code} onChange={setCode} />}
        {tab === 'backtest' && <BacktestPanel code={code} onCodeChange={setCode} />}
        {tab === 'optimize' && <OptimizePanel code={code} onCodeChange={setCode} />}
        {tab === 'results' && <ResultsPanel />}

        {/* Saved strategies with actions */}
        <SavedStrategies
          onEdit={(s) => {
            setCode((s as any).code);
            setTab('editor');
          }}
          onBacktest={(s) => {
            setCode((s as any).code);
            setTab('backtest');
          }}
          onOptimize={(s) => {
            setCode((s as any).code);
            setTab('optimize');
          }}
          onRun={(s) => {
            /* fire-and-forget run (mock) */
            console.log('Running strategy:', s.name);
          }}
        />
      </div>
    </SafeBoundary>
  );
} 