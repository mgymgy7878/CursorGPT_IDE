"use client";
import { useEffect, useState } from "react";

export default function StatusBar() {
  const [state, setState] = useState<"idle"|"connecting"|"connected"|"resuming"|"rate-limited"|"error">("idle");
  const [pingMs, setPingMs] = useState<number|undefined>();
  const [model, setModel] = useState<string>("-");
  const [routing, setRouting] = useState<string>("-");
  const [routingReason, setRoutingReason] = useState<string>("");

  useEffect(() => {
    setState("connecting");
    const start = Date.now();
    const es = new EventSource(`/api/public/ai/chat?prompt=${encodeURIComponent("ping")}`);
    es.addEventListener("open", ()=> setState("connected"));
    es.addEventListener("meta", (ev:any) => {
      const t = Date.now() - start;
      if (pingMs==null) setPingMs(t);
      const txt = String(ev.data||"");
      if (txt.includes("resumeFrom=")) setState("resuming");
      if (txt.includes("model=") || txt.includes("modelOverride=")) {
        const m = txt.match(/model=([^\s]+)/)?.[1];
        if (m) setModel(m);
        const ov = txt.match(/modelOverride=([^\s]+)/)?.[1];
        if (ov) setModel(ov);
      }
      const r = txt.match(/routing=([^\s]+)/)?.[1]; if (r) setRouting(r);
      const rr = txt.match(/routingReason=([^\n]+)/)?.[1]; if (rr) setRoutingReason(rr);
    });
    es.addEventListener("message", (ev:any) => {
      if (String(ev.data||"").includes("rate-limited")) setState("rate-limited");
    });
    es.addEventListener("error", ()=> setState((s)=> s==="rate-limited"? s : "error"));
    const timer = setTimeout(()=>{ try{ es.close(); }catch{} }, 3000);
    return () => { clearTimeout(timer); try{ es.close(); }catch{} };
  }, []);

  const badge = (txt:string, tone:"ok"|"warn"|"err"|"muted"="muted") =>
    <span className={
      "text-[11px] px-2 py-0.5 rounded-full border " +
      (tone==="ok"?"bg-emerald-50 border-emerald-200 text-emerald-700":
       tone==="warn"?"bg-amber-50 border-amber-200 text-amber-700":
       tone==="err"?"bg-rose-50 border-rose-200 text-rose-700":
       "bg-neutral-50 border-neutral-200 text-neutral-600")
    }>{txt}</span>;

  const sseTone = state==="connected"?"ok":state==="resuming"?"warn":state==="rate-limited"?"err":"muted";
  return (
    <div className="w-full flex flex-wrap items-center gap-2 text-xs p-2 border rounded-2xl bg-white">
      {badge(`SSE: ${state}`, sseTone)}
      {badge(`ping≈${pingMs??"-"}ms`, "muted")}
      {badge(`model: ${model}`, "muted")}
      {badge(`routing: ${routing}`, "muted")}
      {routingReason ? badge(`reason: ${routingReason}`, "muted"): null}
    </div>
  );
} 