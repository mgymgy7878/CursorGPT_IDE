'use client'
import dynamic from "next/dynamic";
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CodeEditor({value, onChange}: {value: string; onChange: (v: string) => void}) {
  return (
    <Monaco 
      height="420px" 
      language="typescript" 
      theme="vs-dark"
      value={value} 
      onChange={(v) => onChange(v ?? '')} 
      options={{
        fontLigatures: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
} 