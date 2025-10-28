'use client';
import { useEffect, useRef } from 'react';
import type { CopilotMessage } from '@/types/copilot';

interface MessageListProps {
  messages: CopilotMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">🤖</div>
          <div className="text-sm">Merhaba! Size nasıl yardımcı olabilirim?</div>
          <div className="text-xs mt-2">Slash komutları için / yazın</div>
        </div>
      )}
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : msg.role === 'event'
                ? 'bg-gray-100 text-gray-600 text-xs'
                : msg.role === 'system'
                ? 'bg-amber-50 text-amber-800 text-sm'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {msg.role === 'assistant' && msg.metadata?.needsConfirm && (
              <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded mb-2">
                ⚠️ Onay Gerekli (Dry-Run)
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            <div className="text-xs opacity-70 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString('tr-TR')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

