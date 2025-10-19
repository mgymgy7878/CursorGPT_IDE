import { runBacktest, Config, Result } from "./engine";
import { Counter, Histogram } from "prom-client";

export const m = {
  jobs: new Counter({ name:"spark_backtest_jobs_total", help:"backtest jobs" }),
  err:  new Counter({ name:"spark_backtest_errors_total", help:"backtest errors" }),
  lat:  new Histogram({ name:"spark_backtest_latency_ms", help:"backtest latency", buckets:[50,100,250,500,1000,2000,5000,10000] })
};

export async function runJob(bars:any[], cfg:Config):Promise<Result>{
  const end = Date.now(); 
  m.jobs.inc(); 
  const stop = m.lat.startTimer();
  try { 
    const r = runBacktest(bars as any, cfg); 
    stop(); 
    return r; 
  }
  catch(e){ 
    stop(); 
    m.err.inc(); 
    throw e; 
  }
}

