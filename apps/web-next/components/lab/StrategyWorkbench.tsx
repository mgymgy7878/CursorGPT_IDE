'use client';

import { useState, useCallback } from "react";
import { bus } from "@/lib/event-bus";
import CodeEditor from "./CodeEditor";
import SavedStrategies from "./SavedStrategies";

export default function StrategyWorkbench() {
  const [code, setCode] = useState('// buy if rsi<30; sell if rsi>70;');

  const openBacktest = useCallback(() => bus.emit('lab:open:backtest' as any, { code }), [code]);
  const openOptimize = useCallback(() => bus.emit('lab:open:optimize' as any, { code }), [code]);
  const openRun = useCallback(() => bus.emit('lab:open:run' as any, { code }), [code]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={openBacktest}>
          Backtest
        </button>
        <button className="btn" onClick={openOptimize}>
          Optimizasyon
        </button>
        <button className="btn" onClick={openRun}>
          Çalıştır
        </button>
      </div>
      
      <CodeEditor value={code} onChange={setCode} />
      
      <SavedStrategies
        onEdit={(s) => setCode((s as any).code)}
        onBacktest={(s) => bus.emit('lab:open:backtest' as any, { code: (s as any).code })}
        onOptimize={(s) => bus.emit('lab:open:optimize' as any, { code: (s as any).code })}
        onRun={(s) => bus.emit('lab:open:run' as any, { code: (s as any).code })}
      />
    </div>
  );
} 