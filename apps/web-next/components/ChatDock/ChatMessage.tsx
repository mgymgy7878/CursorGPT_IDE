'use client';
import { ChatMessage as ChatMessageType } from "./ChatDock";

interface ChatMessageProps {
  msg: ChatMessageType;
}

export default function ChatMessage({ msg }: ChatMessageProps) {
  const isUser = msg.role === 'user';
  const isAI = msg.role === 'assistant';
  const isTool = msg.role === 'tool';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : isAI 
            ? 'bg-zinc-800 text-zinc-100' 
            : 'bg-yellow-600/20 text-yellow-200 border border-yellow-600/30'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs opacity-70">
            {isUser ? 'Siz' : isAI ? 'AI' : 'Tool'}
          </span>
          {msg.meta?.ts && (
            <span className="text-xs opacity-50">
              {new Date(msg.meta.ts).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.meta?.tool && (
          <div className="mt-1 text-xs opacity-70">
            Tool: {msg.meta.tool}
          </div>
        )}
      </div>
    </div>
  );
} 