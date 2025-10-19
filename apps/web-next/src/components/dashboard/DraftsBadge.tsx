"use client";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Drafts Badge
 * Shows count of drafts awaiting review
 * V1.3-P4: Migrated to StatusBadge
 */
export default function DraftsBadge() {
  const [count, setCount] = useState<number>(0);
  
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/lab/publish", { cache: "no-store" as any });
        const j = await r.json().catch(() => ({}));
        setCount(Number(j?.count ?? 0));
      } catch { 
        setCount(0); 
      }
    })();
  }, []);
  
  if (count <= 0) return null;
  
  return (
    <StatusBadge 
      status={count >= 5 ? 'warn' : 'neutral'} 
      label={`Drafts: ${count}`}
    />
  );
}

