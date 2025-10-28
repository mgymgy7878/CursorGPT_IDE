import { performance } from "node:perf_hooks";

export function perfMw(prefix = "spark_perf") {
  return (req: any, res: any, next: any) => {
    const t0 = performance.now();
    
    res.on("finish", () => {
      const dt = performance.now() - t0;
      const route = req.path || "unknown";
      
      // histogram: spark_perf_http_duration_ms{route="<path>"} observe dt
      console.log(`[PERF] ${route}: ${dt.toFixed(2)}ms`);
      
      // TODO: Mevcut metrics emitter'ınıza bağlayın
      // metrics.histogram.observe({ route }, dt);
    });
    
    next();
  };
} 