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

"use client";

import StatusBar from "@/components/status-bar";
import LeftNav from "@/components/left-nav";
import { useRightRail } from "./RightRailContext";
import { DividerWithHandle } from "./RailHandle";
import { IconSpark } from "@/components/ui/LocalIcons";
import CopilotDock from "@/components/copilot/CopilotDock";
import { ReactNode, useRef, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  pillButtonVariant,
  dividerHorizontal,
  bodyText,
  subtleText,
} from "@/styles/uiTokens";
import { cn } from "@/lib/utils";
import { useDeferredLocalStorageState } from "@/hooks/useDeferredLocalStorageState";
import { useDensityMode } from "@/hooks/useDensityMode";
import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  RIGHT_RAIL_EXPANDED,
  RIGHT_RAIL_COLLAPSED,
  RIGHT_RAIL_DOCK,
  PANEL_TRANSITION_MS,
  LS_SIDEBAR_COLLAPSED,
  LS_RIGHT_RAIL_OPEN,
  DEFAULT_SIDEBAR_COLLAPSED,
  DEFAULT_RIGHT_RAIL_OPEN,
  TOPBAR_HEIGHT,
  LS_COPILOT_DOCK_COLLAPSED,
} from "./layout-tokens";
import { IconShield, IconBell, IconBarChart } from "@/components/ui/LocalIcons";
import { useNavIndicators } from "@/hooks/useNavIndicators";
import { NavBadge } from "@/components/ui/NavBadge";

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
        document.documentElement.style.setProperty("--composer-h", `${h}px`);
      }
    });

    observer.observe(el);

    // Initial measurement
    document.documentElement.style.setProperty(
      "--composer-h",
      `${el.offsetHeight}px`
    );

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--composer-h");
    };
  }, []);

  // Mac/Windows mod tuşu belirleme (client-side only)
  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <div
      ref={ref}
      className="px-4 py-3 border-t border-white/8 bg-neutral-900/50"
    >
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
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">
          {modKey}
        </kbd>
        <span className="text-white/30">+</span>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono">
          K
        </kbd>
      </div>
    </div>
  );
}

interface AppFrameProps {
  children: ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  const rightRail = useRightRail();
  const router = useRouter();

  // PATCH K: Density mode (runtime toggle)
  const [density] = useDensityMode();

  // PATCH O/Q: Viewport="short" + Glance otomatiği
  useEffect(() => {
    const updateViewport = () => {
      if (typeof window !== 'undefined') {
        const height = window.innerHeight;
        if (height < 820) {
          document.documentElement.setAttribute('data-viewport', 'short');
        } else {
          document.documentElement.removeAttribute('data-viewport');
        }
        // PATCH Q: Glance mode (innerHeight < 860)
        if (height < 860) {
          document.documentElement.setAttribute('data-glance', '1');
        } else {
          document.documentElement.removeAttribute('data-glance');
        }
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Panel state'leri (HYDRATION SAFE: ilk render default, mount sonrası localStorage)
  // DEFAULT: Her iki panel de collapsed (overlay modu)
  const [sidebarCollapsed, setSidebarCollapsed] = useDeferredLocalStorageState(
    LS_SIDEBAR_COLLAPSED,
    DEFAULT_SIDEBAR_COLLAPSED
  );
  // PATCH X: 10 Ocak 2026 görünümü - Sağ panel varsayılan açık (tüm sayfalarda)
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMarketData = pathname?.includes('/market-data');
  const defaultRightOpen = DEFAULT_RIGHT_RAIL_OPEN; // 10 Ocak görünümü: tüm sayfalarda varsayılan açık

  // PATCH: Gerçek fullscreen - view=full olduğunda chrome'u gizle
  const isMarketFullscreen = pathname?.startsWith('/market-data') && searchParams?.get('view') === 'full';

  const [rightOpen, setRightOpen] = useDeferredLocalStorageState(
    LS_RIGHT_RAIL_OPEN,
    defaultRightOpen
  );

  // PATCH: Paneller tamamen bağımsız - auto-collapse kaldırıldı (Figma parity)
  // Sidebar ve RightDock state'leri birbirini etkilemez

  // PATCH F: Copilot dock collapse state (localStorage persist)
  const [copilotCollapsed, setCopilotCollapsed] = useDeferredLocalStorageState(
    LS_COPILOT_DOCK_COLLAPSED,
    false
  );

  // Pinned mod: layout shift kabul edilir, normal genişlik
  // Unpinned mod: overlay hover/focus genişleme
  // Figma parity: Sidebar default expanded (icon+label), RightRail default closed (dock launcher)
  const leftPinned = !sidebarCollapsed;
  const rightPinned = rightOpen;

  // PATCH: Responsive panel genişlikleri (clamp) - iki panel aynı anda açık kalabilir
  // Sidebar expanded: clamp(220px, 18vw, 280px)
  // Sidebar collapsed: 72px (icon-only)
  // RightDock open: clamp(340px, 26vw, 460px)
  // RightDock collapsed: 72px (rail)
  const sidebarW = sidebarCollapsed ? "w-[72px]" : "w-[clamp(220px,18vw,280px)]";
  const rightW = rightOpen ? "w-[clamp(340px,26vw,460px)]" : "w-[72px]";

  // PATCH I: Hover davranışı kaldırıldı - sadece pin/toggle butonu ile kontrol
  // Sidebar artık hover ile açılıp kapanmıyor, sadece toggle butonu ile kontrol ediliyor

  // Fullscreen modunda body overflow hidden
  useEffect(() => {
    if (isMarketFullscreen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMarketFullscreen]);

  // ESC key handler for fullscreen exit - router.push kullan (window.location yerine)
  useEffect(() => {
    if (!isMarketFullscreen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Workspace'e dön (symbol korunur)
        const symbol = searchParams?.get('symbol');
        const params = new URLSearchParams();
        if (symbol) params.set('symbol', symbol);
        params.set('view', 'workspace');
        router.push(`/market-data?${params.toString()}`);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMarketFullscreen, searchParams, router]);

  return (
    <div
      className={cn(
        "fixed inset-0 h-dvh flex flex-col overflow-hidden",
        isMarketFullscreen && "h-screen w-screen p-0"
      )}
      style={
        {
          // CSS variables for layout
          "--sidebar-expanded-w": `${SIDEBAR_EXPANDED}px`,
          "--rail-expanded-w": `${RIGHT_RAIL_EXPANDED}px`,
          "--transition-duration": `${PANEL_TRANSITION_MS}ms`,
          "--topbar-h": `${TOPBAR_HEIGHT}px`,
          backgroundColor: "var(--app-bg, #0a0a0a)",
        } as React.CSSProperties
      }
    >
      {/* TopStatusBar - fullscreen'de gizle */}
      {!isMarketFullscreen && <StatusBar />}

      {/* Main Layout: Flex (Sidebar + Handle + Main + Handle + RightRail) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT: Sidebar - Pin/Toggle Only (PATCH I: hover kaldırıldı) - fullscreen'de gizle */}
        {!isMarketFullscreen && (
          <>
            <aside
              className={cn("flex-shrink-0 relative", sidebarW)}
              style={{
                transition: `width var(--transition-duration) ease-out`,
              }}
            >
              {/* Sidebar sadece pin/toggle butonu ile kontrol ediliyor */}
              <div className="relative z-10">
                <LeftNav collapsed={!leftPinned} />
              </div>
            </aside>

            {/* Sol Divider + Handle */}
            <DividerWithHandle
              side="left"
              isOpen={leftPinned}
              onToggle={() => setSidebarCollapsed((v) => !v)}
            />
          </>
        )}

        {/* Main Content Area - PATCH I: Viewport budget kesinleştir */}
        <main className={cn(
          "flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col",
          isMarketFullscreen && "overflow-hidden"
        )}>
          <div
            className={cn(
              "h-[calc(100dvh-var(--app-topbar-h,48px))] min-h-0 overflow-hidden flex flex-col scroll-gutter-stable",
              isMarketFullscreen && "overflow-hidden p-0"
            )}
            style={isMarketFullscreen ? {} : {
              paddingLeft: 'var(--page-px, 12px)',
              paddingRight: 'var(--page-px, 12px)',
              paddingTop: 'var(--page-pt, 10px)',
              // PATCH W.5b: Bottom padding - density mode'a göre dinamik + safe-area desteği
              paddingBottom: 'calc(var(--page-pb, 32px) + env(safe-area-inset-bottom, 0px))',
              overflowY: 'auto', // PATCH U: İç container scroll alır, body scroll yok
              scrollbarGutter: 'stable', // PATCH HARDENING: Prevent layout jitter
            } as React.CSSProperties}
          >
            {children}
          </div>
        </main>

        {/* Sağ Divider + Handle - fullscreen'de gizle */}
        {!isMarketFullscreen && (
          <>
            <DividerWithHandle
              side="right"
              isOpen={rightPinned}
              onToggle={() => setRightOpen((v) => !v)}
              showDivider={rightPinned}
            />

            {/* RIGHT: RightRail - Pin/Toggle Only (PATCH I: hover kaldırıldı) */}
            <aside
              className={cn("flex-shrink-0 relative", rightW)}
              style={{
                transition: `width var(--transition-duration) ease-out`,
              }}
            >
          {/* Pinned mod: normal expanded görünüm (PATCH F: CopilotDock) */}
          {rightPinned ? (
            <div className="relative z-10 h-full">
              {rightRail || (
                <CopilotDock
                  collapsed={copilotCollapsed}
                  onToggle={() => setCopilotCollapsed(v => !v)}
                />
              )}
            </div>
          ) : (
            <>
              {/* Dock (unpinned modda her zaman görünür) */}
              <div className="relative z-10">
                <RightRailDock onOpenPanel={() => setRightOpen(true)} />
              </div>
            </>
          )}
        </aside>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * RightRailDock - Panel kapalıyken görünen icon dock (Figma Parity P1)
 *
 * PATCH F: Copilot dock toggle entegrasyonu
 * İkonlar: Copilot, Risk/Shield, Alerts, Metrics
 * A11y: tooltip, aria-label, keyboard navigation, focus ring
 * Keyboard: Enter/Space ile panel aç, Tab ile navigate
 */
interface RightRailDockProps {
  onOpenPanel: () => void;
  activeTab?: "copilot" | "risk" | "alerts" | "metrics";
}

function RightRailDock({
  onOpenPanel,
  activeTab = "copilot",
}: RightRailDockProps) {
  // PATCH 8: Right Rail Indicators - useNavIndicators hook'undan badge'leri al
  const indicators = useNavIndicators();

  const dockItems = [
    {
      id: "copilot",
      icon: IconSpark,
      label: "Copilot",
      shortcut: "C",
      color: "text-emerald-400",
      hoverBg: "hover:bg-emerald-500/10",
      badge: indicators.rightRail.spark,
    },
    {
      id: "risk",
      icon: IconShield,
      label: "Risk / Koruma",
      shortcut: "R",
      color: "text-amber-400",
      hoverBg: "hover:bg-amber-500/10",
      badge: indicators.rightRail.shield,
    },
    {
      id: "alerts",
      icon: IconBell,
      label: "Uyarılar",
      shortcut: "A",
      color: "text-yellow-400",
      hoverBg: "hover:bg-yellow-500/10",
      badge: indicators.rightRail.bell,
    },
    {
      id: "metrics",
      icon: IconBarChart,
      label: "Metrikler",
      shortcut: "M",
      color: "text-blue-400",
      hoverBg: "hover:bg-blue-500/10",
      badge: null, // Metrics için badge yok (sistem alarmı varsa pulse eklenebilir)
    },
  ];

  // Keyboard handler - Enter/Space opens panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
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
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={1.8}
                className={cn(
                  "transition-all duration-150",
                  item.color,
                  isActive
                    ? "opacity-100"
                    : "opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
              />
              {/* PATCH 8: Right Rail Badge */}
              {item.badge && (
                <NavBadge
                  type={item.badge.type}
                  variant={item.badge.variant}
                  value={item.badge.value}
                />
              )}
            </div>
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
              <span className="ml-1.5 text-white/40 font-mono">
                {item.shortcut}
              </span>
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
              <IconSpark
                size={16}
                strokeWidth={1.8}
                className="text-emerald-400"
              />
            </div>
            <h2 className="text-[13px] font-semibold text-neutral-200">
              SPARK COPILOT
            </h2>
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
          <span>
            Sistem: <span className="text-emerald-400">Normal</span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Strateji: <span className="text-neutral-300">BTCUSDT</span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Risk: <span className="text-amber-400">Shadow</span>
          </span>
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
              <IconSpark
                size={12}
                strokeWidth={2}
                className="text-emerald-400"
              />
              <span className="text-[10px] font-medium text-emerald-400">
                Copilot
              </span>
            </div>
            {/* PATCH T: Greeting artık CopilotDock içinde global store'da tutuluyor, burada tekrar gösterme */}
            <div className="text-[12px] text-neutral-400 leading-relaxed">
              Portföy durumunu, çalışan stratejileri ve risk limitlerini izliyorum.
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar - ResizeObserver ile FAB offset'i senkronize */}
      <ComposerBar />
    </div>
  );
}
