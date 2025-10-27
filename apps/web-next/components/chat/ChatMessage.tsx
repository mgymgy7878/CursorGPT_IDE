'use client';
import { ChatMessage as ChatMessageType } from "./ChatDock";

interface ChatMessageProps {
  msg: ChatMessageType;
}

export default function ChatMessage({ msg }: ChatMessageProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return '👤';
      case 'assistant': return '🤖';
      case 'tool': return '🔧';
      case 'system': return 'ℹ️';
      default: return '💬';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'text-blue-400';
      case 'assistant': return 'text-green-400';
      case 'tool': return 'text-purple-400';
      case 'system': return 'text-zinc-400';
      default: return 'text-zinc-300';
    }
  };

  const formatToolResult = (content: string) => {
    if (msg.role === 'tool') {
      const lines = content.split('\n');
      return (
        <div className="space-y-2">
          {lines.map((line, i) => {
            if (line.startsWith('✅') || line.startsWith('❌')) {
              return (
                <div key={i} className={`font-medium ${line.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {line}
                </div>
              );
            }
            if (line.includes(':')) {
              const [key, value] = line.split(':');
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{key.trim()}</span>
                  <span className="font-medium">{value.trim()}</span>
                </div>
              );
            }
            return <div key={i} className="text-sm">{line}</div>;
          })}
        </div>
      );
    }
    return content;
  };

  return (
    <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-900/20 ml-8' : 'bg-zinc-900/50 mr-8'}`}>
      <div className="flex items-start space-x-2">
        <span className="text-lg">{getRoleIcon(msg.role)}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${getRoleColor(msg.role)} mb-1`}>
            {msg.role === 'user' ? 'Sen' : 
             msg.role === 'assistant' ? 'AI' :
             msg.role === 'tool' ? 'Tool' : 'Sistem'}
            {msg.meta?.tool && (
              <span className="ml-2 text-zinc-500">({msg.meta.tool})</span>
            )}
          </div>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap">
            {formatToolResult(msg.content)}
          </div>
          {msg.meta?.ts && (
            <div className="text-xs text-zinc-500 mt-1">
              {new Date(msg.meta.ts).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 