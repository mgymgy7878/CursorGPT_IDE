"use client";
import { useState } from "react";

type Action = {
  id: string;
  action: string;
  result: "ok" | "err";
  timestamp: number;
  details?: string;
  traceId?: string;
};

type Props = {
  action: Action;
  children: React.ReactNode;
};

export default function ActionDetailsPopover({ action, children }: Props) {
  const [show, setShow] = useState(false);
  
  // Parse ML details if present
  let mlDetails: any = null;
  if (action.action === "ml.score" && action.details) {
    try {
      mlDetails = JSON.parse(action.details);
    } catch {
      mlDetails = null;
    }
  }
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      {show && (
        <div className="absolute z-20 left-0 top-full mt-2 w-64 p-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl">
          <div className="space-y-2 text-xs">
            {/* Action */}
            <div className="flex justify-between">
              <span className="text-neutral-500">Action:</span>
              <span className="font-mono text-neutral-200">{action.action}</span>
            </div>
            
            {/* Result */}
            <div className="flex justify-between">
              <span className="text-neutral-500">Result:</span>
              <span className={`font-semibold ${
                action.result === "ok" ? "text-green-400" : "text-red-400"
              }`}>
                {action.result.toUpperCase()}
              </span>
            </div>
            
            {/* TraceId */}
            {action.traceId && (
              <div className="flex justify-between">
                <span className="text-neutral-500">TraceId:</span>
                <span className="font-mono text-blue-400 text-[10px] truncate">
                  {action.traceId.slice(0, 16)}...
                </span>
              </div>
            )}
            
            {/* Timestamp */}
            <div className="flex justify-between">
              <span className="text-neutral-500">Time:</span>
              <span className="font-mono text-neutral-400">
                {new Date(action.timestamp).toLocaleString('tr-TR')}
              </span>
            </div>
            
            {/* ML-specific details */}
            {mlDetails && (
              <>
                <div className="pt-2 border-t border-neutral-800"></div>
                <div className="text-neutral-400 font-semibold">ML Score:</div>
                
                {mlDetails.decision !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Decision:</span>
                    <span className={`font-mono font-semibold ${
                      mlDetails.decision === 1 ? "text-green-400" :
                      mlDetails.decision === -1 ? "text-red-400" :
                      "text-neutral-400"
                    }`}>
                      {mlDetails.decision === 1 ? "LONG" : mlDetails.decision === -1 ? "SHORT" : "FLAT"}
                    </span>
                  </div>
                )}
                
                {mlDetails.confid && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Confidence:</span>
                    <span className="font-mono text-purple-400">
                      {parseFloat(mlDetails.confid).toFixed(3)}
                    </span>
                  </div>
                )}
                
                {mlDetails.score && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Score:</span>
                    <span className="font-mono text-neutral-300">
                      {parseFloat(mlDetails.score).toFixed(3)}
                    </span>
                  </div>
                )}
                
                {mlDetails.guardrails !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Guardrails:</span>
                    <span className={`font-semibold ${
                      mlDetails.guardrails ? "text-green-400" : "text-red-400"
                    }`}>
                      {mlDetails.guardrails ? "PASS" : "BLOCK"}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* Generic details */}
            {action.details && !mlDetails && (
              <>
                <div className="pt-2 border-t border-neutral-800"></div>
                <div className="text-neutral-500">Details:</div>
                <div className="text-neutral-400 text-[10px] font-mono max-h-20 overflow-y-auto">
                  {action.details}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

