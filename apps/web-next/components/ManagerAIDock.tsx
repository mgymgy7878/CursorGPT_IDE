'use client';
import { useState } from "react";

export default function ManagerAIDock() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('');

  async function sendMessage() {
    if (!input.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/ai/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setResponse(data.content);
        setProvider(data.provider);
      } else {
        setResponse(`Hata: ${data.error}`);
        setProvider('error');
      }
    } catch (error) {
      setResponse('Bağlantı hatası');
      setProvider('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Manager AI</h3>
        {provider && (
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
            {provider}
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="piyasa özeti, risk analizi..."
          className="flex-1 px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-sm"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-sm text-white disabled:opacity-50"
        >
          {loading ? '...' : 'sor'}
        </button>
      </div>
      
      {response && (
        <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800 text-sm whitespace-pre-wrap max-h-48 overflow-auto">
          {response}
        </div>
      )}
    </div>
  );
} 