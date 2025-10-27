"use client";
import Editor from "@monaco-editor/react";

export default function MonacoEditorClient({ value, onChange, language = "typescript" }: { value?: string; onChange?: (v: string) => void; language?: string; }) {
  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border border-neutral-800">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={value || "// Strategy code..."}
        onChange={(v) => onChange?.(v || "")}
        options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", scrollBeyondLastLine: false, automaticLayout: true }}
        theme="vs-dark"
      />
    </div>
  );
} 