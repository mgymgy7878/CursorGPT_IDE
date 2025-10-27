'use client';

import { useState, useRef } from 'react';

interface TrialData {
  trial_id: number;
  score: number;
  step_ms: number;
  timestamp: number;
}

export default function ClientStarter() {
  const [isRunning, setIsRunning] = useState(false);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [p95StepMs, setP95StepMs] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startExperiment = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTrials([]);
    setBestScore(0);
    setP95StepMs(0);

    let trialCount = 0;
    const maxTrials = Math.floor(Math.random() * 20) + 10; // 10-30 trials

    intervalRef.current = setInterval(() => {
      trialCount++;
      const score = Math.random() * 100;
      const stepMs = Math.random() * 2000 + 500; // 500-2500ms
      
      const newTrial: TrialData = {
        trial_id: trialCount,
        score,
        step_ms: stepMs,
        timestamp: Date.now()
      };

      setTrials(prev => {
        const updated = [...prev, newTrial];
        setBestScore(Math.max(...updated.map(t => t.score)));
        
        const steps = updated.map(t => t.step_ms).sort((a, b) => a - b);
        const p95Index = Math.floor(steps.length * 0.95);
        setP95StepMs(steps[p95Index] || 0);
        
        return updated;
      });

      if (trialCount >= maxTrials) {
        stopExperiment();
      }
    }, Math.random() * 2000 + 1000); // 1-3 second intervals
  };

  const stopExperiment = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const exportJSON = () => {
    const data = {
      experiment_id: `exp_${Date.now()}`,
      trials_total: trials.length,
      best_score: bestScore,
      p95_step_ms: p95StepMs,
      trials: trials,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization_evidence_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{display:'grid', gap:16}}>
      {/* Control Panel */}
      <div style={{
        padding:16, 
        border:'1px solid #e5e7eb', 
        borderRadius:8, 
        backgroundColor:'#f9fafb'
      }}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
          <button
            onClick={isRunning ? stopExperiment : startExperiment}
            style={{
              padding:'8px 16px',
              backgroundColor: isRunning ? '#dc2626' : '#059669',
              color:'white',
              border:'none',
              borderRadius:6,
              cursor:'pointer',
              fontWeight:'bold'
            }}
          >
            {isRunning ? '⏹️ Stop' : '▶️ Start Experiment'}
          </button>
          
          <button
            onClick={exportJSON}
            disabled={trials.length === 0}
            style={{
              padding:'8px 16px',
              backgroundColor: trials.length === 0 ? '#9ca3af' : '#3b82f6',
              color:'white',
              border:'none',
              borderRadius:6,
              cursor: trials.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight:'bold'
            }}
          >
            📥 Export JSON
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
          <div style={{padding:12, backgroundColor:'white', borderRadius:6, border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:12, opacity:0.7, marginBottom:4}}>Trials Total</div>
            <div style={{fontSize:20, fontWeight:'bold'}}>{trials.length}</div>
          </div>
          
          <div style={{padding:12, backgroundColor:'white', borderRadius:6, border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:12, opacity:0.7, marginBottom:4}}>Best Score</div>
            <div style={{fontSize:20, fontWeight:'bold', color:'#059669'}}>
              {bestScore.toFixed(1)}
            </div>
          </div>
          
          <div style={{padding:12, backgroundColor:'white', borderRadius:6, border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:12, opacity:0.7, marginBottom:4}}>P95 Step (ms)</div>
            <div style={{fontSize:20, fontWeight:'bold', color:'#d97706'}}>
              {p95StepMs.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Trial History */}
      {trials.length > 0 && (
        <div style={{
          padding:16,
          border:'1px solid #e5e7eb',
          borderRadius:8,
          maxHeight:300,
          overflow:'auto'
        }}>
          <h3 style={{fontSize:14, marginBottom:12, fontWeight:'bold'}}>Trial History</h3>
          <div style={{display:'grid', gap:8}}>
            {trials.slice(-10).reverse().map((trial) => (
              <div key={trial.trial_id} style={{
                padding:8,
                backgroundColor:'#f9fafb',
                borderRadius:4,
                fontSize:12,
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center'
              }}>
                <span>Trial #{trial.trial_id}</span>
                <span style={{color:'#059669', fontWeight:'bold'}}>
                  Score: {trial.score.toFixed(1)}
                </span>
                <span style={{color:'#6b7280'}}>
                  {trial.step_ms.toFixed(0)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isRunning && (
        <div style={{
          padding:12,
          backgroundColor:'#fef3c7',
          border:'1px solid #f59e0b',
          borderRadius:6,
          textAlign:'center',
          fontSize:14
        }}>
          🔄 Experiment running... {trials.length} trials completed
        </div>
      )}
    </div>
  );
}
