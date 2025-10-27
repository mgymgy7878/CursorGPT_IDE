'use client';
import { useState, useEffect } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { useChatDock } from "./useChatDock";

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  meta?: {
    page: 'dashboard' | 'strategy-lab';
    tool?: string;
    ts?: string;
  };
};

interface ChatDockProps {
  kind: 'manager' | 'strategy';
}

export default function ChatDock({ kind }: ChatDockProps) {
  const [open, setOpen] = useState(true);
  const { messages, loading, handleSend } = useChatDock({ kind });

  // Cmd/Ctrl+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // handleSend is now provided by useChatDock hook

  return (
    <aside className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[440px] bg-zinc-950/90 border-l border-zinc-800 backdrop-blur transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <header className="px-3 py-2 text-sm border-b border-zinc-800 flex items-center justify-between">
        <span className="font-medium">
          {kind === 'manager' ? 'Yönetici AI' : 'Strateji AI'}
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-zinc-200"
        >
          ✕
        </button>
      </header>
      
      <div className="overflow-auto h-[calc(100%-96px)] p-3 space-y-2">
        {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
      </div>
      
      <ChatInput onSend={handleSend} />
    </aside>
  );
} 