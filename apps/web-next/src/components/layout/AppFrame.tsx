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
import { ReactNode, useRef, useEffect, useLayoutEffect, useState, startTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  pillButtonVariant,
  dividerHorizontal,
  bodyText,
  subtleText,
} from "@/styles/uiTokens";
import { cn } from "@/lib/utils";
import { useDeferredLocalStorageState } from "@/hooks/useDeferredLocalStorageState";
import { useUiChrome } from "@/hooks/useUiChrome";
import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  RIGHT_RAIL_EXPANDED,
  RIGHT_RAIL_COLLAPSED,
  RIGHT_RAIL_DOCK,
  PANEL_TRANSITION_MS,
  DEFAULT_SIDEBAR_COLLAPSED,
  TOPBAR_HEIGHT,
  LS_COPILOT_DOCK_COLLAPSED,
  OVERLAY_BREAKPOINT,
  RIGHT_OVERLAY_DIM_OPACITY,
} from "./layout-tokens";
import { IconShield, IconBell, IconBarChart, IconChevronLeft, IconChevronRight } from "@/components/ui/LocalIcons";
import { useNavIndicators } from "@/hooks/useNavIndicators";
import { NavBadge } from "@/components/ui/NavBadge";

/**
 * RightRailHandle - Sağ panel (Copilot) için pill tutamaç (VS Code Secondary Side Bar hissi)
 * Konumlama wrapper'da; buton akışa girmez, anchor (left-0/right-0) asla kaymaz.
 * Hit-area w-11 h-14 (WCAG); görünen pill w-6 h-14.
 */
function RightRailHandle({
  isOpen,
  onToggle,
  position = "left",
  hidden = false,
  handleId,
}: {
  isOpen: boolean;
  onToggle: () => void;
  position?: "left" | "right";
  /** Overlay açıkken shell handle gizlenir (tek handle = panel sol kenarı); DOM'da kalır. */
  hidden?: boolean;
  /** Debug / teşhis: data-handle ile hangi dalın handle'ı olduğu belli olur (right-shell | right-overlay). */
  handleId?: string;
}) {
  const Icon = isOpen ? IconChevronRight : IconChevronLeft;
  const wrapperPos =
    position === "left"
      ? "absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[80]"
      : "absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-[40]";

  return (
    <div
      className={cn(wrapperPos, hidden && "pointer-events-none opacity-0 invisible")}
      {...(hidden && { "aria-hidden": true })}
      {...(handleId && { "data-handle": handleId })}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "Sağ paneli küçült" : "Sağ paneli aç"}
        className={cn(
          "group grid h-14 w-11 place-items-center",
          "hover:bg-transparent active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent"
        )}
      >
        <span
          className={cn(
            "pointer-events-none grid h-14 w-6 place-items-center rounded-full",
            "border border-white/10 bg-neutral-900/70 backdrop-blur shadow-md",
            "transition-colors duration-150",
            "group-hover:bg-neutral-800/80"
          )}
        >
          <Icon size={16} strokeWidth={2} className="h-4 w-4 opacity-80" />
        </span>
      </button>
    </div>
  );
}

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

  // PATCH O/Q: Viewport="short" + Glance otomatiği + ekran genişliği etiketi
  useEffect(() => {
    const updateViewport = () => {
      if (typeof window !== 'undefined') {
        const height = window.innerHeight;
        const width = window.innerWidth;
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
        if (width < 1280) {
          document.documentElement.setAttribute('data-screen', 'narrow');
        } else if (width < 1440) {
          document.documentElement.setAttribute('data-screen', 'compact');
        } else {
          document.documentElement.removeAttribute('data-screen');
        }
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTerminal = pathname?.startsWith('/terminal');

  // PATCH: Gerçek fullscreen - view=full olduğunda chrome'u gizle
  const isMarketFullscreen = pathname?.startsWith('/market-data') && searchParams?.get('view') === 'full';

  const {
    leftOpen,
    rightOpen,
    rightDockMode,
    setLeftOpen,
    setRightOpen,
    toggleLeft,
    closeRight,
    setRightDockMode,
  } = useUiChrome({
    leftDefaultOpen: !DEFAULT_SIDEBAR_COLLAPSED,
    leftCollapseBelow: 1600,
    rightDefaultOpen: false,
    rightCollapseBelow: 1600,
    rightDockModeDefault: "closed",
  });

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
  const [rightMode, setRightMode] = useState<'inline' | 'overlay'>('inline');
  const leftPinned = leftOpen;
  const   rightDockOpen = rightDockMode === 'open';
  const rightDockCollapsed = rightDockMode === 'collapsed';
  const rightPinned = rightDockOpen && rightMode === 'inline';
  // Tek aktif yüzey kuralı: overlay drawer görünürken shell + splitter DOM'dan çıkar, arka plan inert.
  const isRightOverlayVisible =
    !isMarketFullscreen && rightDockOpen && rightMode === 'overlay';

  // Modal drawer: focus trap + restore refs; arka plan inert için wrapper ref
  const overlayPanelRef = useRef<HTMLElement | null>(null);
  const overlayFallbackFocusRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const mainLayoutRef = useRef<HTMLDivElement | null>(null);

  // PATCH: Responsive panel genişlikleri (clamp) - iki panel aynı anda açık kalabilir
  // Sidebar expanded: clamp(220px, 18vw, 280px)
  // Sidebar collapsed: 72px (icon-only)
  // RightDock open: clamp(340px, 26vw, 460px)
  // RightDock collapsed: 72px (rail)
  const sidebarW = leftOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  // FIX: rightW sadece rightPinned (inline + open) iken geniş olmalı
  // overlay modda alan ayrılmaz, overlay ayrı render edilir
  const rightW = rightPinned ? RIGHT_RAIL_EXPANDED : RIGHT_RAIL_COLLAPSED;

  // DEV-ONLY ASSERT: "Ghost blank area" invariant kontrolü (SSR-safe)
  // Bu assert'ler overlay modda yanlış genişlik hesaplamasını yakalar
  // GUARD: typeof window !== "undefined" + NODE_ENV kontrolü birlikte
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // Invariant 1: Overlay modda rightPinned asla true olamaz
    if (rightMode === 'overlay' && rightPinned) {
      console.warn('[AppFrame INVARIANT] ❌ overlay modda rightPinned=true olamaz!', { rightMode, rightPinned, rightDockOpen });
    }
    // Invariant 2: rightPinned=false iken rightW asla EXPANDED olamaz
    if (!rightPinned && rightW === RIGHT_RAIL_EXPANDED) {
      console.warn('[AppFrame INVARIANT] ❌ rightPinned=false iken rightW=EXPANDED olamaz!', { rightPinned, rightW, rightMode });
    }
    // Debug bilgisi: window objesine state yaz (test stability için)
    // Bu obje Playwright testlerinde deterministik bekleme sağlar
    (window as unknown as { __RIGHT_DOCK_DEBUG?: object }).__RIGHT_DOCK_DEBUG = {
      mode: rightMode,
      dockMode: rightDockMode,
      pinned: rightPinned,
      width: rightW,
      dockOpen: rightDockOpen,
      timestamp: Date.now(), // Stability: değişim zamanı
    };
  }

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

  // Global chrome state markers (dashboard layout mode uses these)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-right-open', rightOpen ? '1' : '0');
    root.setAttribute('data-left-open', leftOpen ? '1' : '0');
    root.setAttribute('data-right-mode', rightMode);
    window.dispatchEvent(new CustomEvent('ui:chrome'));
  }, [leftOpen, rightOpen, rightMode]);

  // RightRailShell: ilk paint öncesi doğru mode → hydration flicker azalır (SSR ile aynı branch)
  useLayoutEffect(() => {
    const updateRightMode = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      setRightMode(width < OVERLAY_BREAKPOINT ? 'overlay' : 'inline');
    };
    updateRightMode();
    window.addEventListener('resize', updateRightMode);
    return () => window.removeEventListener('resize', updateRightMode);
  }, []);

  useEffect(() => {
    const mode = searchParams?.get('dock');
    if (mode === 'open' || mode === 'collapsed' || mode === 'closed') {
      setRightDockMode(mode);
    }
  }, [searchParams, setRightDockMode]);

  // ESC closes overlay (handled in focus-trap effect below for focus restore)
  useEffect(() => {
    if (!isRightOverlayVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRight();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRightOverlayVisible, closeRight]);

  // Modal drawer: save focus when overlay opens (for restore on close)
  useEffect(() => {
    if (isRightOverlayVisible && typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isRightOverlayVisible]);

  // Focus trap: move focus into overlay when open. APG: dialog element focusable yapma; ilk odak header (X/ilk buton) veya görünür fallback.
  useEffect(() => {
    if (!isRightOverlayVisible || !overlayPanelRef.current) return;
    const panel = overlayPanelRef.current;
    const getFocusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null && !el.hasAttribute('aria-hidden'));
    const focusables = getFocusables();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      const fallback = overlayFallbackFocusRef.current;
      if (fallback) fallback.focus();
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusables();
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [isRightOverlayVisible]);

  // Arka plan inert: overlay açıkken focus + AT erişimi de kesilir (aria-hidden + pointer-events fallback)
  useEffect(() => {
    const el = mainLayoutRef.current;
    if (!el) return;
    if (isRightOverlayVisible) {
      el.setAttribute('inert', '');
    } else {
      el.removeAttribute('inert');
    }
    return () => el.removeAttribute('inert');
  }, [isRightOverlayVisible]);

  // Scroll lock: modal açıkken arka plan scroll olmasın (trackpad "kıpırdama" hissini sıfırlar)
  useEffect(() => {
    if (!isRightOverlayVisible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isRightOverlayVisible]);

  // Restore focus when overlay closes (önceki öğe DOM'da yoksa main veya body)
  useEffect(() => {
    if (!isRightOverlayVisible && previousActiveElementRef.current) {
      const prev = previousActiveElementRef.current;
      if (typeof prev.focus === 'function' && document.contains(prev)) {
        prev.focus();
      } else {
        const main = document.querySelector('main');
        const first = main?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (first) first.focus();
        else document.body.focus();
      }
      previousActiveElementRef.current = null;
    }
  }, [isRightOverlayVisible]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const nextMode = rightDockOpen
          ? 'collapsed'
          : rightDockCollapsed
          ? 'closed'
          : 'open';
        setRightDockMode(nextMode);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rightDockOpen, rightDockCollapsed, setRightDockMode]);

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
        // Navigation optimization: startTransition
        startTransition(() => {
          router.push(`/market-data?${params.toString()}`);
        });
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

      {/* Main Layout: Overlay açıkken inert + pointer-events-none + aria-hidden (tek aktif yüzey). */}
      <div
        ref={mainLayoutRef}
        data-testid="main-layout-background"
        className={cn("flex flex-1 overflow-hidden min-h-0", isRightOverlayVisible && "pointer-events-none")}
        aria-hidden={isRightOverlayVisible ? "true" : undefined}
      >
        {/* LEFT: Sidebar - Pin/Toggle Only (PATCH I: hover kaldırıldı) - fullscreen'de gizle */}
        {!isMarketFullscreen && (
          <>
            <aside
              className="flex-shrink-0 relative"
              style={{
                width: `${sidebarW}px`,
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
              onToggle={toggleLeft}
            />
          </>
        )}

        {/* Main Content Area - PATCH I: Viewport budget kesinleştir */}
        <main className={cn(
          "relative flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col",
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
              overflowY: 'hidden',
              scrollbarGutter: 'stable', // PATCH HARDENING: Prevent layout jitter
            } as React.CSSProperties}
          >
            {/* Fold-first: Görsel "Yükleniyor" kaldırıldı (sayfa akışını itmesin); sr-only ile a11y korunur */}
            {pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/market-data")) && (
              <p className="sr-only" aria-live="polite">Yükleniyor</p>
            )}
            {children}
          </div>
        </main>

        {/* Sağ: Overlay açıkken shell + splitter render edilmez (tek aktif yüzey; ortadaki handle kaybolur). */}
        {!isMarketFullscreen && !isRightOverlayVisible && (
          <>
            <div
              className="shrink-0 w-px bg-white/6 min-h-0 self-stretch"
              aria-hidden="true"
            />

            <aside
              className="flex-shrink-0 relative min-h-0"
              data-testid="rightdock-aside"
              data-right-rail-shell
              data-right-mode={rightMode}
              data-right-pinned={rightPinned ? '1' : '0'}
              data-right-width={rightW}
              style={{
                width: `${rightW}px`,
                transition: `width var(--transition-duration) ease-out`,
              }}
            >
              <RightRailHandle
                isOpen={rightDockOpen}
                onToggle={() => setRightDockMode(rightDockOpen ? "collapsed" : "open")}
                position="left"
                handleId="right-shell"
              />
              <div className="h-full min-h-0 overflow-hidden">
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
                  <div className="relative z-10 h-full">
                    <RightRailDock
                      onOpenPanel={() => setRightDockMode('open')}
                      onClosePanel={() => setRightOpen(false)}
                    />
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* RIGHT: Modal drawer. Dialog mainLayoutRef'in KARDEŞİ (içinde değil) → aria-hidden ancestor altında kalmaz (WAI-ARIA). */}
      {isRightOverlayVisible && (
        <>
          <div
            className="fixed inset-0 z-[60] cursor-default"
            style={{ backgroundColor: `rgba(0,0,0,${RIGHT_OVERLAY_DIM_OPACITY})` }}
            onClick={closeRight}
            role="presentation"
            aria-hidden="true"
          />
          <aside
            ref={overlayPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="right-rail-dialog-title"
            data-testid="right-rail-dialog"
            className="fixed right-0 z-[70] border-l border-white/10 bg-neutral-950/95 backdrop-blur transition-[transform,opacity] duration-[var(--transition-duration)] ease-out"
            style={{
              top: 'var(--app-topbar-h,48px)',
              bottom: 0,
              width: 'clamp(360px, 24vw, 420px)',
            }}
          >
            <h2 id="right-rail-dialog-title" className="sr-only">
              Copilot paneli
            </h2>
            {/* P3 APG: İlk odak fallback — dialog kendisi focusable değil; odaklanabilir öğe yoksa görünür başlık (klavye kullanıcı "odak nerede" hisseder) */}
            <div
              ref={overlayFallbackFocusRef}
              tabIndex={-1}
              className="px-4 pt-3 pb-1 text-sm font-semibold text-white outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 rounded-sm"
            >
              Spark Copilot
            </div>
            {rightRail || (
              <CopilotDock
                collapsed={copilotCollapsed}
                onToggle={() => setCopilotCollapsed(v => !v)}
              />
            )}
          </aside>
        </>
      )}
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
  onClosePanel: () => void;
  activeTab?: "copilot" | "risk" | "alerts" | "metrics";
}

function RightRailDock({
  onOpenPanel,
  onClosePanel,
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
      <button
        onClick={onClosePanel}
        className={cn(
          "w-10 h-8 mb-2 flex items-center justify-center rounded-lg transition-all duration-150 group",
          "bg-white/5 hover:bg-white/10 border border-white/10",
          "text-white/60 hover:text-white/90",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:ring-blue-500"
        )}
        title="Paneli kapat"
        aria-label="Paneli kapat"
        type="button"
      >
        <span className="text-[12px] font-semibold">X</span>
      </button>
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
