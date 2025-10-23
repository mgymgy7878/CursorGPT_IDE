"use client";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Strategy Lab</h1>
      <Editor height="50vh" defaultLanguage="typescript" defaultValue={`// strateji mantığı`} />
    </div>
  );
}


