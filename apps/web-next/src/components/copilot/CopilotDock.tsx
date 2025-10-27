'use client';
import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { SlashHints } from './SlashHints';
import HistoryList from './HistoryList';
import { parseSlash } from '@/lib/copilot/commands';
import type { CopilotMessage, LiveStatus } from '@/types/copilot';

const LS_KEY = 'copilot-history';

function pushHistory(cmd: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    arr.push({ ts: Date.now(), cmd });
    localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(-50)));
  } catch {
    // ignore
  }
}

interface CopilotDockProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotDock({ isOpen, onClose }: CopilotDockProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [showHints, setShowHints] = useState(false);

  // SSE connection for live status
  useEffect(() => {
    if (!isOpen) return;

    const es = new EventSource('/api/copilot/stream');
    
    es.addEventListener('status', (e) => {
      try {
        const status = JSON.parse(e.data);
        setLiveStatus(status);
        
        // Add event message
        setMessages(prev => [
          ...prev,
          {
            id: `evt-${Date.now()}`,
            role: 'event',
            content: `📊 Status güncellendi: ${status.health}`,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [isOpen]);

  // Listen for rerun events
  useEffect(() => {
    function onRerun(e: any) {
      const cmd = e.detail;
      setInput(cmd);
      // Trigger send after input set
      setTimeout(() => {
        const sendBtn = document.querySelector('[data-copilot-send]') as HTMLButtonElement;
        if (sendBtn) sendBtn.click();
      }, 100);
    }
    window.addEventListener('copilot-rerun', onRerun);
    return () => window.removeEventListener('copilot-rerun', onRerun);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Save to history
    pushHistory(input);
    
    setInput('');
    setLoading(true);

    try {
      // Check if slash command
      const action = parseSlash(input);
      
      if (action) {
        // Execute action
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
        // Regular chat
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

  const quickActions = [
    { label: 'Health', cmd: '/health' },
    { label: 'Metrics', cmd: '/metrics' },
    { label: 'Orders', cmd: '/orders' },
    { label: 'Positions', cmd: '/positions' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-semibold">Copilot</span>
          {liveStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              liveStatus.health === 'healthy' ? 'bg-green-100 text-green-700' :
              liveStatus.health === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {liveStatus.health === 'healthy' ? '🟢' : 
               liveStatus.health === 'degraded' ? '🟡' : '🔴'}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(action => (
            <button
              key={action.cmd}
              onClick={() => setInput(action.cmd)}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* History */}
      <div className="px-4 py-2 border-t">
        <div className="text-xs text-gray-500 mb-1">Geçmiş</div>
        <HistoryList />
      </div>

      {/* Input */}
      <div className="relative px-4 py-3 border-t">
        {showHints && (
          <SlashHints
            onSelect={(cmd) => {
              setInput(cmd + ' ');
              setShowHints(false);
            }}
            filter={input.startsWith('/') ? input : ''}
          />
        )}
        <div className="flex gap-2">
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
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            data-copilot-send
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}

