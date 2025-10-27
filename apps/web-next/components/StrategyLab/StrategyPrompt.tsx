import React, { useState } from "react";
import { useStrategyLabStore } from "../../stores/useStrategyLabStore";

export default function StrategyPrompt() {
  const { generate, runBacktest, linting, lintIssues, compiling, compileDiagnostics } = useStrategyLabStore();
  const [prompt, setPrompt] = useState('SMA50/200 + RSI filtresi');
  const [autoTest, setAutoTest] = useState(true);

  async function onGenerate(action: 'generate'|'fix'|'improve') {
    await generate(prompt, action);
    if (autoTest) { runBacktest(); }
  }

  return (
    <div style={{ display:'grid', gap:8 }}>
      <textarea className="input" rows={5} value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <button className="btn primary" onClick={()=>onGenerate('generate')}>Generate</button>
        <button className="btn" onClick={()=>onGenerate('fix')}>Fix</button>
        <button className="btn" onClick={()=>onGenerate('improve')}>Improve</button>
        <label className="chip" style={{ cursor:'pointer' }}>
          <input type="checkbox" checked={autoTest} onChange={e=>setAutoTest(e.target.checked)} style={{ marginRight:6 }} />
          Auto Backtest
        </label>
        <span className="chip" title="lint">
          {linting ? 'Lint…' : (lintIssues?.length ? `Lint • ${lintIssues.length}` : 'Lint ✓')}
        </span>
        <span className="chip" title="compile">
          {compiling ? 'Compile…' : (compileDiagnostics?.length ? `Compile • ${compileDiagnostics.length}` : 'Compile ✓')}
        </span>
      </div>
    </div>
  );
} 
