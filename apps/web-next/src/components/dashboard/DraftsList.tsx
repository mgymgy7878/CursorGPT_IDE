"use client";
import { useEffect, useState } from "react";

type Draft = { id: string; createdAt: string };

export default function DraftsList() {
  const [items, setItems] = useState<Draft[]>([]);
  useEffect(() => {
    (async () => {
      try{
        const r = await fetch("/api/lab/publish", { cache: "no-store" as any });
        const j = await r.json().catch(()=>({}));
        setItems(Array.isArray(j?.items)? j.items : []);
      }catch{ setItems([]); }
    })();
  }, []);
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="mb-2 font-medium">Drafts awaiting review</div>
      {items.length === 0 ? <div className="text-sm text-neutral-500">None</div> : (
        <ul className="text-sm space-y-2">
          {items.map(d => <li key={d.id} className="rounded-xl border border-neutral-800 p-2">{d.id} — {new Date(d.createdAt).toLocaleString()}</li>)}
        </ul>
      )}
    </div>
  );
}

