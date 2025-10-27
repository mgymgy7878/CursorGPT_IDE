"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiMe, apiSignOut } from "../lib/api";
import { initialFromSub } from "../lib/ui/avatar";
import SSELogViewer from "./SSELogViewer";

const MetricsMini = dynamic(() => import("./MetricsMini.js"), { ssr: false });

type Me = { sub?: string; role?: "admin"|"user"|"public"; dev?: boolean };

export default function UserMenu() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logEndpoint, setLogEndpoint] = useState<string | undefined>(undefined);
  const [showMetrics, setShowMetrics] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    apiMe().then(v => { if (alive) setMe(v || null); }).catch(() => {});
    const onDoc = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => { alive = false; document.removeEventListener("click", onDoc); };
  }, [open]);

  async function onSignOut() {
    await apiSignOut();
    router.refresh();
  }

  const initial = initialFromSub(me?.sub);
  const role = me?.role ?? "public";

  return (
    <>
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(o => !o)} className="w-9 h-9 rounded-full border bg-gray-100 flex items-center justify-center shadow-sm">
          <span className="text-sm font-semibold">{initial}</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-md overflow-hidden">
            <div className="px-3 py-2 border-b">
              <div className="text-sm font-semibold">#{me?.sub ?? "unknown"}</div>
              <div className="text-xs text-gray-500">role: {role}{me?.dev ? " (dev)" : ""}</div>
            </div>
            <div className="py-1">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => { setLogEndpoint(undefined); setShowLogs(true); setOpen(false); }}>
                Open SSE Log Viewer
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => { setLogEndpoint("/api/protected/logs/audit"); setShowLogs(true); setOpen(false); }}>
                Open Audit Stream
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => { setShowMetrics(true); setOpen(false); }}>
                Open Metrics Mini
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600" onClick={onSignOut}>
                Çıkış yap
              </button>
            </div>
          </div>
        )}
      </div>

      <SSELogViewer open={showLogs} onClose={() => setShowLogs(false)} endpoint={logEndpoint} />
      <MetricsMini open={showMetrics} onClose={() => setShowMetrics(false)} />
    </>
  );
} 
