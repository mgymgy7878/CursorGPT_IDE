import React from "react";
import dynamic from "next/dynamic";
import { useStrategyLabStore } from "../../stores/useStrategyLabStore";

const Editor = dynamic(() => import('@monaco-editor/react').then(m => m.default as any), { ssr:false }) as any;

export default function StrategyEditor() {
  const { code, setCode } = useStrategyLabStore();
  return (
    <div className="panel" style={{ padding:8 }}>
      <Editor value={code} language="typescript" onChange={(v:string)=>setCode(v)} height={360} options={{ minimap:{ enabled:false } }} />
    </div>
  );
} 
