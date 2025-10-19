"use client";
import { useState } from "react";
import { toast } from "@/components/toast/Toaster";

type Props = {
  traceId: string;
  short?: boolean;
};

export default function TraceId({ traceId, short = true }: Props) {
  const [showFull, setShowFull] = useState(false);
  
  if (!traceId) return null;
  
  const display = short && !showFull 
    ? traceId.slice(0, 8) + "..." 
    : traceId;
  
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(traceId);
      toast({
        type: "success",
        title: "TraceId Kopyalandı",
        description: traceId.slice(0, 24) + "..."
      });
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = traceId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      toast({
        type: "success",
        title: "TraceId Kopyalandı",
        description: traceId.slice(0, 24) + "..."
      });
    }
  }
  
  return (
    <div className="relative inline-block">
      <button
        onClick={copyToClipboard}
        onMouseEnter={() => setShowFull(true)}
        onMouseLeave={() => setShowFull(false)}
        className="font-mono text-xs text-neutral-500 hover:text-blue-400 transition-colors cursor-pointer"
        title={`Click to copy: ${traceId}`}
      >
        {display}
      </button>
      
      {showFull && (
        <div className="absolute z-10 left-0 top-full mt-1 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono whitespace-nowrap shadow-lg">
          {traceId}
          <div className="text-blue-400 text-[10px] mt-0.5">
            ⎘ Click to copy
          </div>
        </div>
      )}
    </div>
  );
}

