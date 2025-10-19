"use client";
import React, { useState } from "react";
import { backtest, optimize } from "../../lib/api/exec";

export function LabToolbar({ onResult }:{ onResult:(r:any)=>void }){
  const [busy,setBusy]=useState<null|"bt"|"opt">(null);
  return (
    <div className="flex gap-2 p-2">
      <button className="px-3 py-1 border rounded" disabled={!!busy} onClick={async()=>{ setBusy("bt"); try{ onResult(await backtest({dryRun:true})) } finally{ setBusy(null);} }}>Backtest</button>
      <button className="px-3 py-1 border rounded" disabled={!!busy} onClick={async()=>{ setBusy("opt"); try{ onResult(await optimize({dryRun:true})) } finally{ setBusy(null);} }}>Optimize</button>
    </div>
  );
}


