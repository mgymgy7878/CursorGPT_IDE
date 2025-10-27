// Basit in-memory job store (dev için). Prod'da Redis önerilir.
export type JobKind = 'backtest'|'optimize'|'run';
export type Job = {
  id: string;
  kind: JobKind;
  status: 'queued'|'running'|'done'|'failed';
  pct: number;
  startedAt: number;
  durationMs: number;       // ilerleme hesaplamak için
  result?: any;
  error?: string;
};
const JOBS = new Map<string, Job>();

export function createJob(kind: JobKind, durationMs=7000) {
  const id = `${kind}-${Math.random().toString(36).slice(2,9)}`;
  const j: Job = { id, kind, status:'running', pct:0, startedAt:Date.now(), durationMs };
  JOBS.set(id, j);
  return j;
}

export function getJob(id: string) {
  const j = JOBS.get(id);
  if (!j) return null;
  // yüzdeyi zamana göre hesapla (server cron yoksa bile sorunsuz akar)
  const dt = Date.now() - j.startedAt;
  const pct = Math.min(100, Math.floor((dt / j.durationMs) * 100));
  j.pct = pct;
  if (pct >= 100 && j.status !== 'done' && j.status !== 'failed') {
    j.status = 'done';
    if (j.kind === 'backtest') {
      j.result = {
        summary: { trades: 42, winRate: 0.57, pnl: 123.45 },
        equity_curve: Array.from({length: 120}, (_,i)=>({
          time: `2024-01-${String((i%28)+1).padStart(2,'0')}`,
          value: 1000 + i*2 + Math.sin(i/5)*10
        })),
      };
    } else if (j.kind === 'optimize') {
      j.result = {
        best: { rsiLow: 28, rsiHigh: 71, take: 1.4, stop: 0.7 },
        leaderboard: [
          { params:'(28,71,1.4,0.7)', score:0.78 },
          { params:'(30,70,1.3,0.8)', score:0.75 },
        ]
      };
    } else {
      j.result = { started:true, mode:'paper', symbol:'BTCUSDT' };
    }
  }
  return j;
}

export function cancelJob(id:string) { return JOBS.delete(id); } 