'use client';
import { useEffect, useRef, useState } from "react";
import StatusBar from "./StatusBar";

type Msg = { role: 'system'|'user'|'assistant'; content: string };

function Rendered({ text }: { text: string }) {
	const lines = text.split('\n');
	return (
		<div className="space-y-1">
			{lines.map((ln, i) => {
				const isHdr = ln.startsWith('TL;DR');
				const isProof = ln.startsWith('Kanıt:');
				return (
					<div key={i} className={isHdr ? 'font-semibold' : isProof ? 'opacity-70 text-xs' : ''}>
						{ln}
					</div>
				);
			})}
		</div>
	);
}

export default function ChatDock() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const [streaming, setStreaming] = useState(false);
	const [msgs, setMsgs] = useState<Msg[]>([
		{ role: 'system', content: 'Spark Copilot hazır. /status, /advise, /drift kullan.' }
	]);
	const [modelMeta, setModelMeta] = useState<string|undefined>(undefined);
	const [toast, setToast] = useState<string>('');
	const esRef = useRef<EventSource|null>(null);

	useEffect(() => () => { esRef.current?.close(); }, []);
	// Prefill entegrasyonu: formlar ChatDock girişini doldurabilsin
	useEffect(() => {
		const handler = (e: any) => {
			try {
				const cmd = String(e?.detail?.cmd || '');
				const el = document.getElementById('spark-chat-input') as HTMLInputElement | null;
				if (el) { 
					el.value = cmd; el.focus();
					const AUTO = (process.env.NEXT_PUBLIC_PREFILL_AUTOSEND === '1') || ((window as any).__PREFILL_AUTOSEND==='1');
					if (AUTO && cmd.trim()) {
						const ke = new KeyboardEvent('keydown', { key: 'Enter' });
						el.dispatchEvent(ke);
					}
				}
				setInput(cmd);
			} catch {}
		};
		window.addEventListener('spark.prefill', handler as any);
		return () => window.removeEventListener('spark.prefill', handler as any);
	}, []);

	const onRateLimited = () => {
		setToast('Rate limit aşıldı — 60sn içinde tekrar deneyin.');
		setTimeout(()=>setToast(''), 4000);
	};

	const send = (prompt: string) => {
		if (streaming) return;
		setMsgs(m => [...m, { role: 'user', content: prompt }]);
		setStreaming(true);
		const url = `/api/public/ai/chat?prompt=${encodeURIComponent(prompt)}`;
		const es = new EventSource(url);
		esRef.current = es;
		es.addEventListener('meta', (ev: MessageEvent) => {
			const v = String((ev as any).data || '');
			if (v.startsWith('model=')) setModelMeta(v.replace('model=',''));
		});
		es.onmessage = (ev) => { 
			if (ev.data) {
				if (String(ev.data||'').includes('rate-limited')) onRateLimited();
				setMsgs(m => [...m, { role: 'assistant', content: ev.data }]);
			}
		};
		es.onerror = () => { es.close(); setStreaming(false); };
		es.addEventListener('done', () => { es.close(); setStreaming(false); });
	};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) return;
		setInput('');
		send(trimmed);
	};

	return (
		<>
			<button onClick={() => setOpen(o => !o)} className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg px-4 py-2 bg-black text-white">Copilot</button>
			{open && (
				<div className="fixed bottom-20 right-4 z-50 w-[360px] max-h-[70vh] rounded-2xl shadow-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col">
					<div className="px-4 py-2 text-sm font-semibold border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
						<span>Spark Copilot</span>
						{modelMeta && (<span className="text-[10px] px-2 py-0.5 rounded-full border">{modelMeta}</span>)}
					</div>
					<div className="p-2"><StatusBar /></div>
					<div className="px-2 pb-2 flex flex-wrap gap-2">
						{[
							{label:"/status", cmd:"/status"},
							{label:"/advise --json", cmd:"/advise --json"},
							{label:"/drift.explain --json", cmd:"/drift.explain symbol=BTCUSDT window=24h --json"},
							{label:"/audit.tail --json", cmd:"/audit.tail n=50 --json"},
						].map(b=>(
							<button key={b.label}
								onClick={()=>window.dispatchEvent(new CustomEvent('spark.prefill',{detail:{cmd:b.cmd}}))}
								className="text-[11px] px-2 py-1 border rounded hover:bg-neutral-50">
								{b.label}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-auto p-3 space-y-2 text-sm">
						{msgs.map((m, i) => (
							<div key={i} className={m.role==='user' ? 'text-right' : m.role==='system' ? 'opacity-70' : ''}>
								<div className={`inline-block px-3 py-2 rounded-xl whitespace-pre-wrap ${m.role==='user'?'bg-blue-600 text-white':'bg-neutral-100 dark:bg-neutral-800'}`}>
									{m.role==='assistant' ? <Rendered text={m.content}/> : m.content}
								</div>
							</div>
						))}
					</div>
					<form onSubmit={onSubmit} className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
						<input id="spark-chat-input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Mesaj yaz (/help, /status, /advise, /drift, /freshness, /report)..." className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 outline-none"/>
						<button disabled={streaming} className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50">Gönder</button>
					</form>
				</div>
			)}
			{toast ? (
				<div className="fixed bottom-4 right-4 px-3 py-2 text-xs bg-amber-100 border border-amber-300 text-amber-800 rounded-lg shadow">
					{toast}
				</div>
			) : null}
		</>
	);
} 