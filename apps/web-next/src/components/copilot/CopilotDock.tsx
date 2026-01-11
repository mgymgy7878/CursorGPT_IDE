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
import { usePathname, useSearchParams } from 'next/navigation';
import { IconSpark } from '@/components/ui/LocalIcons';
import { cn } from '@/lib/utils';
import { COMMAND_TEMPLATES, getTemplatesForScope, type CommandTemplate } from './commandTemplates';
import { useDeferredLocalStorageState } from '@/hooks/useDeferredLocalStorageState';
import { useCopilotContext, formatContextForPrompt } from '@/hooks/useCopilotContext';
import { SparkAvatar } from './SparkAvatar';
import { uiCopy } from '@/lib/uiCopy';
import { useLiveSession } from '@/lib/live-react/useLiveSession';
import { writeEvidence } from '@/lib/live-react/evidence';
import { useDebugTrigger } from '@/components/debug/LiveDebugBadge';

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
  const searchParams = useSearchParams();
  const context = useCopilotContext();

  // Gate C/D: Support mock mode via URL param
  const mockFlag = searchParams.get('mock') === '1';

  // PATCH T: Copilot greeting'i global store'da tut (localStorage persist)
  const GREETING_KEY = 'copilot.greeting.shown';
  const GREETING_MESSAGE = 'Merhaba, ben Spark Copilot. Portföy durumunu, çalışan stratejileri ve risk limitlerini izliyorum. İstersen önce genel portföy riskini çıkarabilirim.';

  const [messages, setMessages] = useState<Message[]>(() => {
    // İlk render'da greeting gösterilmiş mi kontrol et
    if (typeof window !== 'undefined') {
      const greetingShown = localStorage.getItem(GREETING_KEY);
      if (greetingShown === 'true') {
        return []; // Greeting gösterilmişse boş başla
      }
      // İlk kez gösteriliyorsa greeting ekle ve flag'i set et
      localStorage.setItem(GREETING_KEY, 'true');
      return [{
        id: '1',
        type: 'assistant',
        content: GREETING_MESSAGE,
        timestamp: new Date(),
      }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Gate C: Live session manager
  const { state: sessionState, telemetry, start: startSession, abort: abortSession, requestId } = useLiveSession();

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

  // Gate C: Handle send message with live session manager
  const handleSend = useCallback((customPrompt?: string) => {
    const prompt = customPrompt || input.trim();

    // Gate C Debug: Log send attempt
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[LIVE] send clicked', {
        hasMock: mockFlag,
        messageLen: prompt.length,
        hasPrompt: !!prompt,
        inputValue: input.trim().slice(0, 20) + '...'
      });
    }

    if (!prompt) {
      console.warn('[LIVE] send aborted: empty prompt');
      return;
    }

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

    // Gate C: Use live session manager (tek stream garantisi)
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';
    let assistantMessage: Message | null = null;

    // Gate C/D: Append mock flag to URL if present + header
    const apiUrl = mockFlag ? '/api/copilot/chat?mock=1' : '/api/copilot/chat';
    const extraHeaders: Record<string, string> = mockFlag ? { 'x-spark-mock': '1' } : {};

    // Gate C Debug: Log startSession call
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[LIVE] startSession', { url: apiUrl, hasMockHeader: mockFlag });
    }

    startSession(
      {
        url: apiUrl,
        method: 'POST',
        headers: extraHeaders,
        body: {
          message: prompt,
          history: messages.map(m => ({
            role: m.type === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content,
          })),
          userId: 'anonymous', // TODO: Get from auth
          userRole: 'readonly', // TODO: Get from user context
          dryRun: true,
        },
        maxTokens: 10000,
        maxChars: 1000000,
        maxDuration: 60000, // 60s
      },
      {
        onToken: (token) => {
          assistantContent += token;

          // Update or create assistant message
          if (!assistantMessage) {
            assistantMessage = {
              id: assistantMessageId,
              type: 'assistant',
              content: assistantContent,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage!]);
          } else {
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: assistantContent }
                : m
            ));
          }
        },
        onEvent: (event) => {
          // P0.5: Support new SSE envelope format
          const eventData = event.data || event;
          const eventType = event.event;

          if (eventType === 'tool_call') {
            console.log('Tool call:', eventData);
          } else if (eventType === 'tool_result') {
            const toolResultData = eventData.data || eventData;
            if (toolResultData && !toolResultData.success) {
              const errorMsg = toolResultData.error || 'Bilinmeyen hata';
              const errorCode = event.errorCode || toolResultData.errorCode;

              if (errorCode === 'NOT_READY') {
                setMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  type: 'assistant',
                  content: `ℹ️ ${errorMsg} (Job henüz tamamlanmadı, lütfen bekleyin)`,
                  timestamp: new Date(),
                }]);
              } else if (errorCode === 'EXECUTION_ERROR' && errorMsg.includes('timeout')) {
                setMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  type: 'assistant',
                  content: `⏱️ ${errorMsg} (İşlem zaman aşımına uğradı)`,
                  timestamp: new Date(),
                }]);
              } else {
                const errorDisplay = errorCode ? `${errorMsg} (${errorCode})` : errorMsg;
                setMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  type: 'assistant',
                  content: `❌ Tool "${toolResultData.tool || 'unknown'}" hatası: ${errorDisplay}`,
                  timestamp: new Date(),
                }]);
              }
            }
          } else if (eventType === 'error') {
            const errorMsg = eventData.error || event.error || 'Bilinmeyen hata';
            const errorCode = event.errorCode || eventData.errorCode;
            const errorDisplay = errorCode ? `${errorMsg} (${errorCode})` : errorMsg;
            setMessages(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              type: 'assistant',
              content: `Hata: ${errorDisplay}`,
              timestamp: new Date(),
            }]);
            setIsLoading(false);
          } else if (eventType === 'job_failed') {
            const failedData = eventData.data || eventData;
            setMessages(prev => [...prev, {
              id: (Date.now() + 3).toString(),
              type: 'assistant',
              content: `Job hatası: ${failedData.error || failedData.message || 'Bilinmeyen hata'}${failedData.errorCode ? ` (${failedData.errorCode})` : ''}`,
              timestamp: new Date(),
            }]);
          }
        },
        onMessage: (message) => {
          // Gate C: Final message (message_done event sonrası)
          if (assistantMessage) {
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: message }
                : m
            ));
          }
        },
        onComplete: () => {
          setIsLoading(false);
          // Gate C: Write evidence
          writeEvidence('live_session', {
            requestId: requestId || telemetry.requestId,
            timestamp: Date.now(),
            state: 'done',
            tokensReceived: telemetry.tokensReceived,
            eventsReceived: telemetry.eventsReceived,
            streamDurationMs: telemetry.streamDurationMs,
            lastEventTs: telemetry.lastEventTs,
          });
        },
        onError: (error, errorCode) => {
          setIsLoading(false);
          const errorMsg = error instanceof Error ? error.message : String(error);
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            type: 'assistant',
            content: `Bağlantı hatası: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}`,
            timestamp: new Date(),
          }]);
          // Gate C: Write evidence
          writeEvidence('live_session', {
            requestId: requestId || telemetry.requestId,
            timestamp: Date.now(),
            state: 'error',
            tokensReceived: telemetry.tokensReceived,
            eventsReceived: telemetry.eventsReceived,
            streamDurationMs: telemetry.streamDurationMs,
            lastEventTs: telemetry.lastEventTs,
            error: errorMsg,
            errorCode,
          });
        },
        onAbort: () => {
          setIsLoading(false);
          // Gate C: Write evidence
          writeEvidence('cancel', {
            requestId: requestId || telemetry.requestId,
            timestamp: Date.now(),
            state: 'aborted',
            tokensReceived: telemetry.tokensReceived,
            eventsReceived: telemetry.eventsReceived,
            streamDurationMs: telemetry.streamDurationMs,
            lastEventTs: telemetry.lastEventTs,
          });
        },
      }
    );
  }, [input, messages, startSession, requestId, telemetry, mockFlag]);

  // Gate C: Listen for debug trigger from LiveDebugBadge
  useDebugTrigger(useCallback((message: string) => {
    console.debug('[LIVE] Debug trigger received:', message);
    handleSend(message);
  }, [handleSend]));

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

  // PATCH T: Format context as 3 chips (instead of single line)
  // PATCH V: uiCopy.ts'den context etiketleri
  // PATCH W.2 (P0): Context "—" cleanup - boş değerleri gizle veya eylem göster
  const isMeaningful = (v: string | undefined | null): boolean => {
    if (!v) return false;
    const trimmed = String(v).trim();
    return trimmed !== '' && trimmed !== '—' && trimmed !== '-';
  };

  const formatContextChips = () => {
    const chips: Array<{ label: string; value: string; clickable?: boolean; onClick?: () => void }> = [];

    // System chip - her zaman göster
    chips.push({ label: uiCopy.copilot.context.system, value: uiCopy.copilot.contextValues.normal });

    // Strategy chip - PATCH W.2: boşsa "Seçili değil" göster veya gizle
    const strategyValue = context.symbol || context.strategyName;
    if (isMeaningful(strategyValue)) {
      chips.push({ label: uiCopy.copilot.context.strategy, value: strategyValue as string });
    } else {
      // Boşsa "Seçili değil" + tıklanabilir
      chips.push({
        label: uiCopy.copilot.context.strategy,
        value: 'Seçili değil',
        clickable: true,
        onClick: () => {
          // Navigate to strategies page or open strategy selector
          window.location.href = '/strategies';
        },
      });
    }

    // Mode chip - her zaman göster
    chips.push({ label: uiCopy.copilot.context.mode, value: uiCopy.copilot.contextValues.shadow });

    return chips;
  };

  const contextChips = formatContextChips();

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

      {/* Context Row - PATCH T: 3 küçük chip (tek satır metin yerine) */}
      {/* PATCH W.2 (P0): Boş değerler gizlendi veya "Seçili değil" gösteriliyor */}
      <div className="px-3 py-1.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {contextChips.map((chip, idx) => {
            const Component = chip.clickable ? 'button' : 'span';
            return (
              <Component
                key={idx}
                onClick={chip.onClick}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 border text-neutral-400",
                  chip.clickable
                    ? "border-white/20 hover:border-white/30 hover:bg-white/10 cursor-pointer transition-colors"
                    : "border-white/10"
                )}
              >
                <span className="text-neutral-500">{chip.label}:</span>
                <span className={cn("text-neutral-300", chip.clickable && "hover:text-neutral-200")}>{chip.value}</span>
              </Component>
            );
          })}
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
