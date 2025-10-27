"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  endpoint?: string;
  maxLines?: number;
};

const DEFAULT_ENDPOINT = "/api/protected/logs/sse";
const AUDIT_ENDPOINT = "/api/protected/logs/audit";
const LS_KEY = "sseViewerPrefs.v1";

type Prefs = {
  source: "heartbeat" | "audit";
  backlog: number;
  autoScroll: boolean;
  filter: string;
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { source: "heartbeat", backlog: 0, autoScroll: true, filter: "" };
    const p = JSON.parse(raw);
    return {
      source: p.source ?? "heartbeat",
      backlog: Number.isFinite(p.backlog) ? p.backlog : 0,
      autoScroll: typeof p.autoScroll === "boolean" ? p.autoScroll : true,
      filter: typeof p.filter === "string" ? p.filter : "",
    };
  } catch { return { source: "heartbeat", backlog: 0, autoScroll: true, filter: "" }; }
}

function savePrefs(p: Prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
}

function classify(line: string): "error" | "warn" | "info" | "debug" | null {
  try {
    const j = JSON.parse(line);
    const lvl = (j.level || j.severity || "").toString().toLowerCase();
    const st  = typeof j.status === "number" ? j.status : undefined;
    const ok  = typeof j.ok === "boolean" ? j.ok : undefined;

    if (["error","err","fatal","crit","critical"].includes(lvl)) return "error";
    if (["warn","warning"].includes(lvl)) return "warn";
    if (["info","notice"].includes(lvl)) return "info";
    if (["debug","trace"].includes(lvl)) return "debug";

    if (typeof ok === "boolean") return ok ? "info" : "error";
    if (typeof st === "number") {
      if (st >= 500) return "error";
      if (st >= 400) return "warn";
      return "info";
    }
    if (/\berror\b/i.test(line)) return "error";
    if (/\bwarn(ing)?\b/i.test(line)) return "warn";
    return null;
  } catch {
    if (/\berror\b/i.test(line)) return "error";
    if (/\bwarn(ing)?\b/i.test(line)) return "warn";
    return null;
  }
}

function prettyHtml(line: string) {
  try {
    const j = JSON.parse(line);
    const json = JSON.stringify(j, null, 2);
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const colored = esc(json)
      .replace(/"(.*?)":/g, "<span class='text-indigo-600'>\"$1\"</span>:")
      .replace(/: "([^"]*)"/g, ": <span class='text-green-700'>\"$1\"</span>")
      .replace(/: ([\d\.\-eE]+)/g, ": <span class='text-blue-700'>$1</span>")
      .replace(/: (true|false|null)/g, ": <span class='text-rose-600'>$1</span>");
    return { __html: colored };
  } catch {
    return { __html: line.replace(/</g, "&lt;") };
  }
}

export default function SSELogViewer({ open, onClose, endpoint, maxLines = 500 }: Props) {
  const init = typeof window !== "undefined" ? loadPrefs() : { source: "heartbeat", backlog: 0, autoScroll: true, filter: "" };
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string>(init.filter);
  const [autoScroll, setAutoScroll] = useState<boolean>(init.autoScroll);
  const [lines, setLines] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, dropped: 0, errors: 0 });
  const [source, setSource] = useState<"heartbeat"|"audit">(endpoint === AUDIT_ENDPOINT ? "audit" : init.source as "heartbeat"|"audit");
  const [backlog, setBacklog] = useState<number>(init.backlog);

  const esRef = useRef<EventSource | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { savePrefs({ source, backlog, autoScroll, filter }); }, [source, backlog, autoScroll, filter]);

  const endp = useMemo(() => {
    const base = source === "audit" ? AUDIT_ENDPOINT : (endpoint || DEFAULT_ENDPOINT);
    if (source === "audit" && backlog > 0) {
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}backlog=${backlog}`;
    }
    return base;
  }, [source, endpoint, backlog]);

  const append = useCallback((line: string) => {
    setLines(prev => {
      const next = [...prev, line];
      setStats(s => ({ ...s, total: s.total + 1 }));
      if (next.length > maxLines) {
        const drop = next.length - maxLines;
        setStats(s => ({ ...s, dropped: s.dropped + drop }));
        return next.slice(-maxLines);
      }
      return next;
    });
  }, [maxLines]);

  useEffect(() => {
    if (!open) {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setConnected(false);
      return;
    }
    const es = new EventSource(endp, { withCredentials: true });
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setStats(s => ({ ...s, errors: s.errors + 1 }));
    es.onmessage = ev => { if (!paused) append(ev.data); };
    es.addEventListener("ready", () => {});
    es.addEventListener("hb", () => {});
    return () => { es.close(); esRef.current = null; setConnected(false); };
  }, [open, endp, paused, append]);

  useEffect(() => {
    if (!autoScroll || !boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [lines, autoScroll]);

  const clear = () => setLines([]);
  const copyAll = async () => { await navigator.clipboard.writeText(lines.join("\n")); };
  const download = () => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `sse-logs-${new Date().toISOString().replace(/[:.]/g,"_")}.log`; a.click(); URL.revokeObjectURL(url);
  };

  const filtered = filter ? lines.filter(l => l.toLowerCase().includes(filter.toLowerCase())) : lines;

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[620px] max-w-[95vw] rounded-2xl border shadow-xl bg-white">
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <strong className="mr-auto">SSE Log Viewer</strong>
        <select value={source} onChange={e => setSource(e.target.value as any)} className="px-2 py-1 text-xs border rounded">
          <option value="heartbeat">heartbeat</option>
          <option value="audit">audit</option>
        </select>
        {source === "audit" && (
          <input
            type="number" min={0} step={1024} placeholder="backlog bytes"
            value={backlog} onChange={e => setBacklog(parseInt(e.target.value || "0") || 0)}
            className="w-28 px-2 py-1 text-xs border rounded" title="Tail backlog (bytes)"
          />
        )}
        <span className="text-xs text-gray-500">conn:{connected ? "on" : "off"} total:{stats.total} drop:{stats.dropped} err:{stats.errors}</span>
        <button className="px-2 py-1 text-xs border rounded" onClick={() => setPaused(p => !p)}>{paused ? "Resume" : "Pause"}</button>
        <button className="px-2 py-1 text-xs border rounded" onClick={() => setAutoScroll(a => !a)}>{autoScroll ? "AutoScroll✓" : "AutoScroll"}</button>
        <button className="px-2 py-1 text-xs border rounded" onClick={clear}>Clear</button>
        <button className="px-2 py-1 text-xs border rounded" onClick={copyAll}>Copy</button>
        <button className="px-2 py-1 text-xs border rounded" onClick={download}>Download</button>
        <button className="px-2 py-1 text-xs border rounded bg-red-50" onClick={onClose}>Close</button>
      </div>
      <div className="px-3 py-2 flex items-center gap-2 border-b">
        <input placeholder="filter..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full px-2 py-1 border rounded" />
      </div>
      <div ref={boxRef} className="h-80 overflow-auto font-mono text-[11px] p-3 whitespace-pre-wrap leading-5">
        {filtered.map((l, i) => {
          const sev = classify(l);
          const html = prettyHtml(l);
          const cls =
            sev === "error" ? "bg-red-50/60 text-red-950" :
            sev === "warn"  ? "bg-amber-50/60 text-amber-950" :
            sev === "info"  ? "bg-blue-50/50 text-slate-900" :
            sev === "debug" ? "bg-slate-50 text-slate-600" : "";
          return <div key={i} className={`rounded px-2 py-1 mb-1 ${cls}`} dangerouslySetInnerHTML={html} />;
        })}
      </div>
    </div>
  );
} 
