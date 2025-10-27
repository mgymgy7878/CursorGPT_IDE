// services/strategyMachine.ts
import { useStrategyStore } from "@/stores/useStrategyStore";
import { StrategyAPI } from "@/lib/api";
import type { OptimizeRanges } from "@/types/strategy";

let running = false;
let controllers: AbortController[] = [];

const addCtrl = () => {
  const c = new AbortController();
  controllers.push(c);
  return c;
};

export function cancelAutoFlow() {
  if (controllers.length) {
    controllers.forEach(c => { try { c.abort(); } catch {} });
    controllers = [];
  }
  running = false;
  const s = useStrategyStore.getState();
  s.setStep("cancelled");
  s.appendConsole("warning", "Akış iptal edildi.");
}

export async function runAutoFlow(opts?: { optimize?: boolean; optimizeRanges?: OptimizeRanges; }) {
  if (running) { useStrategyStore.getState().appendConsole("warning","Zaten bir akış çalışıyor, lütfen bekleyin."); return; }
  running = true; controllers = [];
  const st = useStrategyStore.getState();
  const log = (lvl: any, msg: string) => useStrategyStore.getState().appendConsole(lvl, msg);

  try {
    st.setStep("generating"); log("info", "Generate: Strateji oluşturuluyor…");
    const g = await StrategyAPI.generate(
      { method: "ai", language: st.language, wizard: st.wizard, selectedIndicators: [] },
      addCtrl().signal
    );
    if (!g.success || !g.data) throw new Error("Generate başarısız");
    st.setCode(g.data.code); log("success", "Generate: OK");

    st.setStep("compiling"); log("info", "Compile: Derleniyor…");
    const c = await StrategyAPI.compile(st.code, st.language, addCtrl().signal);
    st.setDiagnostics(c.diagnostics);
    if (!c.success) throw new Error("Compile fail");
    log("success", "Compile: OK");

    st.setStep("linting"); log("info", "Lint: Çalışıyor…");
    const l = await StrategyAPI.lint(st.code, st.language, addCtrl().signal);
    st.setIssues(l.issues);
    if (!l.success && l.issues.some(i => i.sev === "error")) throw new Error("Lint fail");
    log("success", "Lint: OK");

    st.setStep("backtesting"); log("info", "Backtest: Başladı…");
    const b = await StrategyAPI.backtest({ code: st.code, language: st.language, params: st.backtestParams }, addCtrl().signal);
    if (!b.success || !b.backtestResult) throw new Error("Backtest fail");
    st.setResult(b.backtestResult); log("success", "Backtest: OK");

    if (opts?.optimize) {
      st.setStep("optimizing"); log("info", "Optimize: Grid/Bayesian…");
      const o = await StrategyAPI.optimize({
        code: st.code, language: st.language, params: st.backtestParams,
        ranges: opts.optimizeRanges || { emaFast: [5,25,5], emaSlow: [20,80,10], rsiPeriod: [10,30,2] },
        suggestRangesByTimeframe: true,
      }, addCtrl().signal);

      if (o.success) {
        if (o.optimizedParams) {
          st.setBestParams(o.optimizedParams);
          log("success", `Optimize: En iyi set → ${JSON.stringify(o.optimizedParams)}`);
        }
        if ((o as any).samples?.length) {
          useStrategyStore.getState().setOptimizeSamples((o as any).samples, o.targetMetric || "Sharpe");
          log("info", `Optimize: ${(o as any).samples.length} örnek alındı (heatmap).`);
        }

        st.setStep("backtesting"); log("info", "Backtest (best set): Yeniden…");
        const b2 = await StrategyAPI.backtest({ code: st.code, language: st.language, params: st.backtestParams }, addCtrl().signal);
        if (b2.success && b2.backtestResult) { st.setResult(b2.backtestResult); log("success", "Backtest (best): OK"); }
      } else {
        log("warning","Optimize: Uygun sonuç yok.");
      }
    }

    st.setStep("done");
  } catch (err: any) {
    if (err?.name === "AbortError") {
      log("warning", "İstek iptal edildi.");
      st.setStep("cancelled");
    } else {
      useStrategyStore.getState().appendConsole("error", `Akış hata: ${err?.message || String(err)}`);
      st.setStep("error");
    }
  } finally {
    controllers = [];
    running = false;
  }
} 