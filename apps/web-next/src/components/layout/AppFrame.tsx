/**
 * AppFrame - Shell Anayasası (Figma Parity + Hydration Safe)
 *
 * Tüm shell yapısı (TopStatusBar + LeftNav + RightRail + Main) burada tanımlı.
 * Sayfalar shell'e dokunmaz; sadece main içeriği verir.
 *
 * KURAL: Shell yapısı sadece burada değiştirilir. Sayfa layout'ları shell'e dokunmaz.
 *
 * HYDRATION: İlk render SADECE default değerler kullanır (SSR ile aynı).
 * localStorage mount sonrası okunur → SSR/CSR uyumu sağlanır.
 *
 * Layout: [sidebar] [handle] [main] [handle] [right-rail]
 */

'use client';

import StatusBar from '@/components/status-bar';
import LeftNav from '@/components/left-nav';
import { useRightRail } from './RightRailContext';
import { DividerWithHandle } from './RailHandle';
import { IconSpark } from '@/components/ui/LocalIcons';
import { ReactNode, useRef, useEffect } from 'react';
import { pillButtonVariant, dividerHorizontal, bodyText, subtleText } from '@/styles/uiTokens';
import { cn } from '@/lib/utils';
import { useDeferredLocalStorageState } from '@/hooks/useDeferredLocalStorageState';
import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  RIGHT_RAIL_OPEN,
  RIGHT_RAIL_CLOSED,
  RIGHT_RAIL_DOCK,
  PANEL_TRANSITION_MS,
  LS_SIDEBAR_COLLAPSED,
  LS_RIGHT_RAIL_OPEN,
  DEFAULT_SIDEBAR_COLLAPSED,
  DEFAULT_RIGHT_RAIL_OPEN,
} from './layout-tokens';
import { IconShield, IconBell, IconBarChart } from '@/components/ui/LocalIcons';

/**
 * ComposerBar - Chat input bar with ResizeObserver for FAB offset sync
 * Sets --composer-h CSS variable on document root
 */
function ComposerBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        document.documentElement.style.setProperty('--composer-h', `${h}px`);
      }
    });

    observer.observe(el);

    // Initial measurement
    document.documentElement.style.setProperty('--composer-h', `${el.offsetHeight}px`);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--composer-h');
    };
  }, []);

  // Mac/Windows mod tuşu belirleme (client-side only)
  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div ref={ref} className="px-4 py-3 border-t border-white/8 bg-neutral-900/50">
      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder='Örn: "Bugünkü piyasa rejimine göre BTCUSDT için trade planı üret"'
          className="flex-1 px-3 py-2 text-[13px] font-medium bg-neutral-800 border border-white/8 rounded-lg text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none leading-none"
          disabled
        />
        <button
          className="px-3 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0 leading-none"
          disabled
        >
          Gönder
        </button>
      </div>
      {/* Keyboard hint - Figma parity: tek otorite hint */}
      <div className="flex items-center justify-end gap-1.5 mt-2 text-[11px] text-white/40">
        <span className="hidden sm:inline">Komutlar</span>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">{modKey}</kbd>
        <span className="text-white/30">+</span>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">K</kbd>
      </div>
    </div>
  );
}

interface AppFrameProps {
  children: ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  const rightRail = useRightRail();

  // Panel state'leri (HYDRATION SAFE: ilk render default, mount sonrası localStorage)
  // DEFAULT: Sol panel dar (collapsed), sağ panel açık
  const [sidebarCollapsed, setSidebarCollapsed] = useDeferredLocalStorageState(
    LS_SIDEBAR_COLLAPSED,
    DEFAULT_SIDEBAR_COLLAPSED
  );
  const [rightOpen, setRightOpen] = useDeferredLocalStorageState(
    LS_RIGHT_RAIL_OPEN,
    DEFAULT_RIGHT_RAIL_OPEN
  );

  // CSS variable değerleri
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  // RightRail: Açıkken full width, kapalıyken dock width
  const railWidth = rightOpen ? RIGHT_RAIL_OPEN : RIGHT_RAIL_DOCK;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-neutral-950"
      style={{
        // CSS variables for layout
        '--sidebar-w': `${sidebarWidth}px`,
        '--rail-w': `${railWidth}px`,
        '--transition-duration': `${PANEL_TRANSITION_MS}ms`,
      } as React.CSSProperties}
    >
      {/* TopStatusBar */}
      <StatusBar />

      {/* Main Layout: Sidebar + Handle + Main + Handle + RightRail */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LeftNav - Global Navigation */}
        <div
          className="shrink-0 overflow-hidden bg-neutral-950"
          style={{
            width: 'var(--sidebar-w)',
            transition: `width var(--transition-duration) ease-out`,
          }}
        >
          <LeftNav collapsed={sidebarCollapsed} />
        </div>

        {/* Sol Divider + Handle */}
        <DividerWithHandle
          side="left"
          isOpen={!sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />

        {/* Main Content Area - Golden Master: h-full zinciri için overflow-hidden */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden bg-neutral-950">
          <div className="h-full min-h-0">
            {children}
          </div>
        </main>

        {/* Sağ Divider + Handle */}
        <DividerWithHandle
          side="right"
          isOpen={rightOpen}
          onToggle={() => setRightOpen(v => !v)}
          showDivider={rightOpen}
        />

        {/* RightRail - Copilot Panel veya Icon Dock */}
        <div
          className="shrink-0 overflow-hidden bg-neutral-950"
          style={{
            width: 'var(--rail-w)',
            transition: `width var(--transition-duration) ease-out`,
          }}
        >
          {rightOpen ? (
            rightRail || <RightRailCopilotSkeleton />
          ) : (
            <RightRailDock onOpenPanel={() => setRightOpen(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * RightRailDock - Panel kapalıyken görünen icon dock (Figma Parity P1)
 *
 * İkonlar: Copilot, Risk/Shield, Alerts, Metrics
 * A11y: tooltip, aria-label, keyboard navigation, focus ring
 * Keyboard: Enter/Space ile panel aç, Tab ile navigate
 */
interface RightRailDockProps {
  onOpenPanel: () => void;
  activeTab?: 'copilot' | 'risk' | 'alerts' | 'metrics';
}

function RightRailDock({ onOpenPanel, activeTab = 'copilot' }: RightRailDockProps) {
  const dockItems = [
    { id: 'copilot', icon: IconSpark, label: 'Copilot', shortcut: 'C', color: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500/10' },
    { id: 'risk', icon: IconShield, label: 'Risk / Koruma', shortcut: 'R', color: 'text-amber-400', hoverBg: 'hover:bg-amber-500/10' },
    { id: 'alerts', icon: IconBell, label: 'Uyarılar', shortcut: 'A', color: 'text-yellow-400', hoverBg: 'hover:bg-yellow-500/10' },
    { id: 'metrics', icon: IconBarChart, label: 'Metrikler', shortcut: 'M', color: 'text-blue-400', hoverBg: 'hover:bg-blue-500/10' },
  ];

  // Keyboard handler - Enter/Space opens panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenPanel();
    }
  };

  return (
    <div
      className="h-full flex flex-col items-center py-3 bg-neutral-950 border-l border-white/6"
      role="toolbar"
      aria-label="Panel kısayolları"
    >
      {dockItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={onOpenPanel}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-10 h-10 mb-1 flex items-center justify-center rounded-lg transition-all duration-150 group relative",
              // Focus ring for keyboard navigation
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:ring-blue-500",
              // Hover state with colored background
              item.hoverBg,
              // Active state
              isActive && "bg-white/5 ring-1 ring-white/10"
            )}
            title={`${item.label} (${item.shortcut})`}
            aria-label={`${item.label} panelini aç`}
            aria-pressed={isActive}
            tabIndex={0}
          >
            <Icon
              size={20}
              strokeWidth={1.8}
              className={cn(
                "transition-all duration-150",
                item.color,
                isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100"
              )}
            />
            {/* Tooltip - custom positioning */}
            <span
              className={cn(
                "absolute right-full mr-2 px-2 py-1 text-[11px] font-medium rounded bg-neutral-800 border border-white/10 text-white whitespace-nowrap",
                "opacity-0 pointer-events-none transition-opacity duration-150",
                "group-hover:opacity-100 group-focus-visible:opacity-100"
              )}
              role="tooltip"
            >
              {item.label}
              <span className="ml-1.5 text-white/40 font-mono">{item.shortcut}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * RightRail Copilot Skeleton - Figma Parity v0
 *
 * Figma'daki Copilot panel görünümüne yaklaş:
 * - Header (SPARK COPILOT + Canlı badge)
 * - Model bilgisi
 * - Sistem/Strateji/Risk modu özeti
 * - Hızlı aksiyon butonları
 * - Chat body placeholder
 * - Input bar
 */
function RightRailCopilotSkeleton() {
  return (
    <div className="h-full flex flex-col bg-neutral-950/50 border-l border-white/6">
      {/* Header - Figma parity v2: subtitle + Model label */}
      <div className="px-4 py-2.5 bg-neutral-900/30 border-b border-white/10">
        {/* Top row: Avatar + Title + Canlı | Model label + pill */}
        <div className="flex items-center justify-between mb-1">
          {/* Left: Spark Avatar + Title + Canlı pill */}
          <div className="flex items-center gap-2 min-w-0">
            {/* SparkAvatar - modern gradient icon */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <IconSpark size={16} strokeWidth={1.8} className="text-emerald-400" />
            </div>
            <h2 className="text-[13px] font-semibold text-neutral-200">SPARK COPILOT</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              Canlı
            </span>
          </div>
          {/* Right: Model label + pill (Figma) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-500">Model</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-neutral-300">
              ChatGPT 5.1 - Trader
            </span>
          </div>
        </div>
        {/* Subtitle row (Figma) */}
        <div className="text-[10px] text-neutral-500 pl-9">
          Ana AI Trader - Global Yönetici
        </div>
      </div>

      {/* System Info - Compact */}
      <div className="px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3 text-[10px] text-neutral-500">
          <span>Sistem: <span className="text-emerald-400">Normal</span></span>
          <span className="text-white/20">·</span>
          <span>Strateji: <span className="text-neutral-300">BTCUSDT</span></span>
          <span className="text-white/20">·</span>
          <span>Risk: <span className="text-amber-400">Shadow</span></span>
        </div>
      </div>

      {/* Quick Actions - Compact pills */}
      <div className="px-4 py-2 border-b border-white/10">
        <div className="flex flex-wrap gap-2">
          <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/8 border border-white/10 text-white/70 hover:text-white/90 transition-colors">
            Portföy riskini analiz et
          </button>
          <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/8 border border-white/10 text-white/70 hover:text-white/90 transition-colors">
            Çalışan stratejileri özetle
          </button>
          <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/8 border border-white/10 text-white/70 hover:text-white/90 transition-colors">
            Bugün için işlem önerisi
          </button>
        </div>
      </div>

      {/* Chat Body (Placeholder) */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <IconSpark size={12} strokeWidth={2} className="text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">Copilot</span>
            </div>
            <div className="text-[12px] text-neutral-400 leading-relaxed">
              Merhaba, ben Spark Copilot. Portföy durumunu, çalışan stratejileri ve risk limitlerini izliyorum. İstersen önce genel portföy riskini çıkarabilirim.
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar - ResizeObserver ile FAB offset'i senkronize */}
      <ComposerBar />
    </div>
  );
}
