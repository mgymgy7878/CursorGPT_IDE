'use client';
import { SLASH_COMMANDS } from '@/lib/copilot/commands';

interface SlashHintsProps {
  onSelect: (command: string) => void;
  filter?: string;
}

export function SlashHints({ onSelect, filter = '' }: SlashHintsProps) {
  const filtered = SLASH_COMMANDS.filter(cmd => 
    filter ? cmd.command.includes(filter) || cmd.description.toLowerCase().includes(filter.toLowerCase()) : true
  );

  if (!filter || filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
      {filtered.map(cmd => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm text-blue-600">{cmd.command}</div>
              <div className="text-xs text-gray-500">{cmd.description}</div>
            </div>
            {cmd.requiresAdmin && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                ADMIN
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">{cmd.example}</div>
        </button>
      ))}
    </div>
  );
}

