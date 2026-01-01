/**
 * CopilotDock - Figma Parity PATCH F + G
 *
 * PATCH G İyileştirmeleri:
 * - Context-aware prompts (route bazlı bağlam enjeksiyonu)
 * - Klavye ergonomisi (Esc, ↑/↓, Enter)
 * - Son kullanılan komutlar (localStorage)
 * - UI iyileştirmeleri (padding, typography, composer)
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { IconSpark } from '@/components/ui/LocalIcons';
import { cn } from '@/lib/utils';
import { COMMAND_TEMPLATES, getTemplatesForScope, type CommandTemplate } from './commandTemplates';
import { useDeferredLocalStorageState } from '@/hooks/useDeferredLocalStorageState';
import { useCopilotContext, formatContextForPrompt } from '@/hooks/useCopilotContext';
import { SparkAvatar } from './SparkAvatar';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotDockProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const LS_RECENT_COMMANDS = 'ui.copilotRecentCommands.v1';
const MAX_RECENT_COMMANDS = 5;

export default function CopilotDock({ collapsed: externalCollapsed, onToggle: externalOnToggle }: CopilotDockProps = {}) {
  const pathname = usePathname();
  const context = useCopilotContext();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Merhaba, ben Spark Copilot. Portföy durumunu, çalışan stratejileri ve risk limitlerini izliyorum. İstersen önce genel portföy riskini çıkarabilirim.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Determine scope from pathname
  const scope = pathname?.includes('/dashboard') ? 'dashboard' :
                pathname?.includes('/market-data') ? 'market-data' :
                pathname?.includes('/strategy-lab') ? 'strategy-lab' :
                pathname?.includes('/running') ? 'running' :
                pathname?.includes('/strategies') ? 'strategies' :
                'all';

  // Get templates for current scope
  const availableTemplates = getTemplatesForScope(scope);

  // Collapse state (localStorage persist)
  const [collapsed, setCollapsed] = useDeferredLocalStorageState(
    'ui.copilotDockCollapsed.v1',
    false
  );

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : collapsed;
  const handleToggle = externalOnToggle || (() => setCollapsed(v => !v));

  // Load recent commands from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_RECENT_COMMANDS);
      if (stored) {
        setRecentCommands(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save recent command
  const saveRecentCommand = useCallback((commandId: string) => {
    setRecentCommands(prev => {
      const updated = [commandId, ...prev.filter(id => id !== commandId)].slice(0, MAX_RECENT_COMMANDS);
      try {
        localStorage.setItem(LS_RECENT_COMMANDS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle "/" command menu
  useEffect(() => {
    if (input === '/') {
      setShowCommandMenu(true);
      setCommandFilter('');
      setSelectedCommandIndex(0);
    } else if (input.startsWith('/')) {
      setShowCommandMenu(true);
      setCommandFilter(input.slice(1).toLowerCase());
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [input]);

  // Click outside to close command menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        commandMenuRef.current &&
        !commandMenuRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowCommandMenu(false);
      }
    };

    if (showCommandMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCommandMenu]);

  // Inject context into prompt
  const injectContext = useCallback((prompt: string, template?: CommandTemplate): string => {
    const contextStr = formatContextForPrompt(context);
    if (contextStr && template?.requiresContext) {
      // Check if all required context fields are available
      const hasRequiredContext = template.requiresContext.every(field => {
        return context[field as keyof typeof context] !== undefined;
      });

      if (hasRequiredContext) {
        return `${contextStr}\n\n${prompt}`;
      }
    }
    return prompt;
  }, [context]);

  // Handle command template selection
  const handleSelectTemplate = useCallback((template: CommandTemplate, autoSend = false) => {
    const enrichedPrompt = injectContext(template.prompt, template);
    setInput(enrichedPrompt);
    setShowCommandMenu(false);
    saveRecentCommand(template.id);

    if (autoSend) {
      // Auto-send after a short delay
      setTimeout(() => {
        handleSend(enrichedPrompt);
      }, 50);
    } else {
      inputRef.current?.focus();
    }
  }, [injectContext, saveRecentCommand]);

  // Handle send message
  const handleSend = useCallback((customPrompt?: string) => {
    const prompt = customPrompt || input.trim();
    if (!prompt) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) {
      setInput(''); // Only clear input if not using custom prompt
    }
    setIsLoading(true);

    // Mock AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Bu konuda size yardımcı olabilirim. "${prompt}" hakkında daha fazla bilgi verebilir miyim?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  }, [input]);

  // Handle quick command chip click
  const handleQuickCommand = useCallback((template: CommandTemplate) => {
    const enrichedPrompt = injectContext(template.prompt, template);
    saveRecentCommand(template.id);
    handleSend(enrichedPrompt);
  }, [injectContext, saveRecentCommand, handleSend]);

  // Filtered templates for command menu
  const filteredTemplates = availableTemplates.filter(t =>
    t.label.toLowerCase().includes(commandFilter) ||
    t.id.toLowerCase().includes(commandFilter)
  );

  // Handle keyboard navigation (PATCH G)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
        setInput('');
        inputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredTemplates.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredTemplates.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (filteredTemplates[selectedCommandIndex]) {
          handleSelectTemplate(filteredTemplates[selectedCommandIndex], true);
        }
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  // Scroll selected command into view
  useEffect(() => {
    if (showCommandMenu && commandMenuRef.current) {
      const selectedElement = commandMenuRef.current.querySelector(
        `[data-command-index="${selectedCommandIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedCommandIndex, showCommandMenu]);

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-3 bg-neutral-950 border-l border-white/6">
        <button
          onClick={handleToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Copilot panelini aç"
        >
          <IconSpark size={20} strokeWidth={1.8} className="text-emerald-400" />
        </button>
      </div>
    );
  }

  // PATCH H: Determine if emoji should be shown (dashboard default: off)
  const showEmoji = scope !== 'dashboard';

  // PATCH H: Format context line (single line with dot separators)
  const formatContextLine = () => {
    const parts: string[] = [];
    parts.push('Sistem: Normal');

    // Strategy: symbol (market-data) or strategyName (dashboard/strategy-lab) or "—"
    if (context.symbol) {
      parts.push(`Strateji: ${context.symbol}`);
    } else if (context.strategyName) {
      parts.push(`Strateji: ${context.strategyName}`);
    } else {
      parts.push('Strateji: —');
    }

    parts.push('Risk modu: Shadow');
    return parts.join(' · ');
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-white/6 rounded-l-2xl shadow-xl">
      {/* Header - PATCH M: Compact (title + model badge aynı satırda) */}
      <div className="px-3 py-2 bg-neutral-900/30 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Spark Avatar + Title + Canlı pill */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <SparkAvatar size="sm" />
            <h2 className="text-[12px] font-semibold text-neutral-200 truncate">
              SPARK COPILOT
            </h2>
            <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              Canlı
            </span>
          </div>
          {/* Right: Model badge (compact) */}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 border border-white/10 text-neutral-300 max-w-[100px] truncate shrink-0">
            GPT-5.1
          </span>
        </div>
      </div>

      {/* Context Row - PATCH M: Compact */}
      <div className="px-3 py-1.5 border-b border-white/10 shrink-0">
        <div className="text-[10px] text-neutral-400 leading-tight">
          {formatContextLine()}
        </div>
      </div>

      {/* Quick Command Chips - PATCH M: Compact height + padding */}
      <div className="px-3 py-1.5 border-b border-white/10 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {availableTemplates.slice(0, 3).map((template) => {
            const isRecent = recentCommands.includes(template.id);
            return (
              <button
                key={template.id}
                onClick={() => handleQuickCommand(template)}
                className={cn(
                  "h-[var(--control-h,36px)] px-2 rounded-full text-[10px] font-medium border transition-colors",
                  "bg-transparent hover:bg-white/5",
                  isRecent
                    ? "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50"
                    : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                )}
                style={{ height: 'calc(var(--control-h, 36px) * 0.7)' }}
              >
                {showEmoji && template.icon && <span className="mr-0.5">{template.icon}</span>}
                {template.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Area - PATCH M: Compact padding + flex-1 min-h-0 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg border",
                message.type === 'assistant'
                  ? "bg-white/[0.02] border-white/10 p-2"
                  : "bg-blue-500/10 border-blue-500/20 ml-auto max-w-[85%] p-2"
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {message.type === 'assistant' && (
                  <IconSpark size={12} strokeWidth={2} className="text-emerald-400" />
                )}
                <span className={cn(
                  "text-[10px] font-medium",
                  message.type === 'assistant' ? "text-emerald-400" : "text-blue-400"
                )}>
                  {message.type === 'assistant' ? 'Copilot' : 'Sen'}
                </span>
              </div>
              <div className="text-[12px] text-neutral-400 leading-snug break-words">
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="bg-white/[0.02] rounded-lg p-2 border border-white/10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <IconSpark size={12} strokeWidth={2} className="text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Copilot</span>
              </div>
              <div className="text-[12px] text-neutral-400">Düşünüyor...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer with Command Menu - PATCH M: Compact padding */}
      <div className="px-3 py-2 border-t border-white/10 bg-neutral-900/50 shrink-0 relative">
        {/* Command Menu (Portal-like dropdown) - PATCH G: Klavye navigasyonu */}
        {showCommandMenu && (
          <div
            ref={commandMenuRef}
            className="absolute bottom-full left-4 right-4 mb-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-50"
          >
            <div className="p-2">
              <div className="text-[10px] text-neutral-500 px-2 py-1 mb-1">
                Komutlar {filteredTemplates.length > 0 && `(${filteredTemplates.length})`}
              </div>
              {filteredTemplates.length === 0 ? (
                <div className="px-2 py-1 text-[11px] text-neutral-500">
                  Komut bulunamadı
                </div>
              ) : (
                filteredTemplates.map((template, index) => {
                  const isSelected = index === selectedCommandIndex;
                  const isRecent = recentCommands.includes(template.id);
                  return (
                    <button
                      key={template.id}
                      data-command-index={index}
                      onClick={() => handleSelectTemplate(template, true)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors flex items-center gap-2",
                        isSelected
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                          : "hover:bg-white/5 text-neutral-300 hover:text-white border border-transparent"
                      )}
                    >
                      {template.icon && <span>{template.icon}</span>}
                      <span className="flex-1">{template.label}</span>
                      {isRecent && (
                        <span className="text-[9px] text-emerald-400">●</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Input Row - PATCH H: Composer Figma parity (kompakt + mavi CTA) */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showCommandMenu ? 'Komut seçin...' : 'Copilot\'a bir şey sor...'}
            className="flex-1 px-3 py-1.5 text-[12px] font-normal bg-neutral-800 border border-white/8 rounded-lg text-neutral-200 placeholder:text-neutral-500/50 focus:border-blue-500 focus:outline-none leading-tight h-8"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-3 py-1.5 h-8 text-[12px] font-medium rounded-lg transition-colors shrink-0 leading-tight flex items-center gap-1.5",
              !input.trim() || isLoading
                ? "bg-neutral-700/50 text-neutral-500 cursor-not-allowed border border-white/5"
                : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/30"
            )}
          >
            <IconSpark size={12} strokeWidth={2} className={cn(!input.trim() || isLoading ? "opacity-40" : "")} />
            <span>Gönder</span>
          </button>
        </div>

        {/* Keyboard hint - PATCH G: Güncellendi */}
        <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-white/30">
          <span className="hidden sm:inline">Komutlar</span>
          <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
            /
          </kbd>
          {showCommandMenu && (
            <>
              <span className="text-white/20">•</span>
              <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
                ↑↓
              </kbd>
              <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
                Esc
              </kbd>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
