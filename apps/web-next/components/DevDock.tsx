"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SSELogViewer = dynamic(() => import("./SSELogViewer"), { ssr: false });
const MetricsMini  = dynamic(() => import("./MetricsMini"),  { ssr: false });

export default function DevDock() {
  const [show] = useState(process.env.NEXT_PUBLIC_DEV_UI !== "0");
  const [openLogs, setOpenLogs] = useState(false);
  const [openMetrics, setOpenMetrics] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key?.toLowerCase?.();
      if (e.ctrlKey && e.altKey && k === "l") { e.preventDefault(); setOpenLogs(true); }
      if (e.ctrlKey && e.altKey && k === "m") { e.preventDefault(); setOpenMetrics(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!show) return null;
  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg bg-black text-white px-4 py-2 text-sm"
        onClick={() => setOpenLogs(o => !o)}
        title="Ctrl+Alt+L (Logs), Ctrl+Alt+M (Metrics)"
      >
        ⚙️ Panels
      </button>
      <button
        className="fixed bottom-4 right-28 z-40 rounded-full shadow-lg bg-black/80 text-white px-4 py-2 text-sm"
        onClick={() => setOpenMetrics(o => !o)}
      >
        📈 Metrics
      </button>
      <SSELogViewer open={openLogs} onClose={() => setOpenLogs(false)} />
      <MetricsMini  open={openMetrics} onClose={() => setOpenMetrics(false)} />
    </>
  );
} 
