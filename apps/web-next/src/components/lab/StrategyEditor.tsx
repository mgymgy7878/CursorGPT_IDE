'use client';
import { useState } from 'react';

export default function StrategyEditor({ spec, onChange }:{ spec:any; onChange:(code:string)=>void }){
  const [code,setCode]=useState<string>(spec?.code||'');
  return (
    <div className="border border-neutral-800 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Strategy Editor</div>
        <button className="btn" onClick={()=>onChange(code)}>Save</button>
      </div>
      <textarea className="w-full h-64 px-2 py-1 rounded border border-neutral-800 bg-black font-mono text-sm" value={code} onChange={e=>setCode(e.target.value)} />
    </div>
  );
}


