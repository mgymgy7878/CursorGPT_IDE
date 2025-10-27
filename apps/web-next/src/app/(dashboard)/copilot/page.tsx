'use client';
import { useState } from 'react';
import { MessageList } from '@/components/copilot/MessageList';
import { SlashHints } from '@/components/copilot/SlashHints';
import { parseSlash, SLASH_COMMANDS } from '@/lib/copilot/commands';
import type { CopilotMessage } from '@/types/copilot';

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const action = parseSlash(input);
      
      if (action) {
        const res = await fetch('/api/copilot/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': localStorage.getItem('admin-token') || '',
          },
          body: JSON.stringify(action),
        });

        const result = await res.json();

        const assistantMsg: CopilotMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: result.error 
            ? `❌ Hata: ${result.error}`
            : result.needsConfirm
            ? `⚠️ Onay Gerekli:\n\n${JSON.stringify(result.dryRunResult, null, 2)}\n\nDevam etmek için ADMIN_TOKEN ile tekrar gönderin.`
            : `✅ Sonuç:\n\n${JSON.stringify(result.data, null, 2)}`,
          timestamp: Date.now(),
          metadata: { needsConfirm: result.needsConfirm },
        };

        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const res = await fetch('/api/copilot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });

        const data = await res.json();

        const assistantMsg: CopilotMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'Anlamadım, lütfen tekrar deneyin.',
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Hata: ${err.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🤖</span>
          <span>Copilot - Tam Ekran</span>
        </h1>
        <p className="text-sm text-white/80 mt-1">
          Sistem yönetimi ve strateji komutları için doğal dil arayüzü
        </p>
      </div>

      {/* Slash Commands Reference */}
      <div className="px-6 py-3 border-b bg-gray-50">
        <details>
          <summary className="text-sm font-medium cursor-pointer">
            📖 Slash Komutları ({SLASH_COMMANDS.length})
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SLASH_COMMANDS.map(cmd => (
              <div key={cmd.command} className="text-xs p-2 bg-white rounded border">
                <div className="font-mono text-blue-600">{cmd.command}</div>
                <div className="text-gray-500">{cmd.description}</div>
                {cmd.requiresAdmin && (
                  <span className="inline-block mt-1 text-xs px-1 py-0.5 bg-amber-100 text-amber-700 rounded">
                    ADMIN
                  </span>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <div className="relative px-6 py-4 border-t bg-white">
        {showHints && (
          <SlashHints
            onSelect={(cmd) => {
              setInput(cmd + ' ');
              setShowHints(false);
            }}
            filter={input.startsWith('/') ? input : ''}
          />
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowHints(e.target.value.startsWith('/'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Mesaj yazın veya / komut..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '⏳ Gönderiliyor...' : '📤 Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

