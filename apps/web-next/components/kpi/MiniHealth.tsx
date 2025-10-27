"use client";
import { useEffect, useState } from "react";

export default function MiniHealth() {
  const [tldr, setTldr] = useState<string>("");
  const [lag, setLag] = useState<number|undefined>();
  const [ack, setAck] = useState<number|undefined>();
  const [evdb, setEvdb] = useState<number|undefined>();

  useEffect(() => {
    const es = new EventSource(`/api/public/ai/chat?prompt=${encodeURIComponent("/status")}`);
    es.addEventListener("message", (ev:any) => {
      const msg = String(ev.data||"");
      if (!tldr && msg.includes("TL;DR")) setTldr(msg);
      const mLag = msg.match(/Lag p95=([0-9]+)ms/i)?.[1];
      const mAck = msg.match(/ACK p95=([0-9]+)ms/i)?.[1];
      const mEv  = msg.match(/Evt→DB p95=([0-9]+)ms/i)?.[1];
      if (mLag) setLag(Number(mLag));
      if (mAck) setAck(Number(mAck));
      if (mEv) setEvdb(Number(mEv));
    });
    es.addEventListener("done", ()=> { try{ es.close(); }catch{} });
    return () => { try{ es.close(); }catch{} };
  }, [tldr]);

  const badge = (val:number|undefined, label:string, thr:number) => {
    const tone = val==null? "muted" : (val<=thr? "ok" : "warn");
    return (
      <div className="flex flex-col items-start p-3 rounded-2xl border bg-white">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className={
          "text-sm font-semibold px-2 py-0.5 rounded " +
          (tone==="ok"?"bg-emerald-50 text-emerald-700":
           tone==="warn"?"bg-amber-50 text-amber-700":"bg-neutral-50 text-neutral-700")
        }>{val ?? "-"}</div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {badge(lag, "Lag p95 (ms)", 2000)}
        {badge(ack, "ACK p95 (ms)", 1000)}
        {badge(evdb, "Evt→DB p95 (ms)", 300)}
      </div>
      <div className="text-xs text-neutral-600 line-clamp-2">{tldr || "Durum yükleniyor..."}</div>
    </div>
  );
} 