"use client";
import { useMarketStore } from "@/stores/marketStore";

export default function PauseToggle() {
  const paused = useMarketStore((s) => s.paused);
  const setPaused = useMarketStore((s) => s.setPaused);
  return (
    <button onClick={() => setPaused(!paused)} className="px-3 py-1 rounded-md border">
      {paused ? "Sürdür" : "Duraklat"}
    </button>
  );
}


