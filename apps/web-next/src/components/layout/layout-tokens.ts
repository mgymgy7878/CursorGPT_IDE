/**
 * Layout Token'ları - Shell Ölçüleri (Figma Parity)
 *
 * TÜM SHELL ÖLÇÜLERİ BURADAN YÖNETİLİR.
 * Figma güncellenince sadece bu değerleri değiştir.
 */

// ========== TOPBAR ==========
export const TOPBAR_HEIGHT = 56; // px - TopStatusBar yüksekliği

// ========== SIDEBAR ==========
export const SIDEBAR_EXPANDED = 240; // px - pinned modda tam genişlik (max)
export const SIDEBAR_COLLAPSED = 56; // px - icon-only genişlik

// ========== RIGHT RAIL ==========
export const RIGHT_RAIL_EXPANDED = 280; // px - pinned modda tam genişlik (max)
export const RIGHT_RAIL_COLLAPSED = 56; // px - kapalı dock genişliği
export const RIGHT_RAIL_DOCK = 56; // px - kapalıyken icon dock genişliği (alias)
export const COPILOT_DOCK_WIDTH = 280; // px - Copilot dock genişliği (PATCH F)

// ========== HANDLE (Figma Pill Style + WCAG hit-area) ==========
export const HANDLE_WIDTH = 28; // px - legacy; prefer HANDLE_PILL_*
export const HANDLE_HEIGHT = 56; // px - legacy
export const HANDLE_RADIUS = 14; // px - rounded-full effect
/** Görünen pill: yükseklik (Tailwind h-14 = 56px) */
export const HANDLE_PILL_H = 56;
/** Görünen pill: genişlik (Tailwind w-6 = 24px) */
export const HANDLE_PILL_W = 24;
/** Tıklanabilir genişlik - WCAG 44×44 / iOS 44pt / Material 48dp (Tailwind w-11 = 44px) */
export const HANDLE_HIT_W = 44;
/** Hit-area yükseklik (sol/sağ handle aynı); Tailwind h-14 = 56px */
export const HANDLE_H = 56;
/** Hit-area genişlik (sol/sağ handle aynı); 44px */
export const HANDLE_W = 44;
/** Dikey hiza: top 50% + -translate-y-1/2 (ileride header'a göre değiştirilebilir) */
export const HANDLE_Y = "50%";

// ========== DIVIDER ==========
export const DIVIDER_WIDTH = 1; // px

// ========== PAGE LAYOUT ==========
export const PAGE_PAD_X = 24; // px - sayfa yatay padding
export const PAGE_PAD_TOP = 10; // px - sayfa üst padding (density: 16 → 10)
export const HEADER_GAP = 8; // px - header ile içerik arası (density: 12 → 8)

// ========== CARDS ==========
export const CARD_RADIUS = 12; // px - kart border-radius
export const CARD_PAD = 12; // px - kart iç padding (density: 16 → 12)

// ========== DENSITY TOKENS (PATCH J) ==========
export const TABLE_ROW_PAD_Y = 8; // px - tablo satır dikey padding (py-2 = 8px)
export const TABLE_HEADER_PAD_Y = 8; // px - tablo header dikey padding
export const CONTROL_H = 36; // px - input/button yüksekliği (h-9 = 36px, density: h-10 → h-9)
export const SECTION_GAP = 12; // px - sayfa içinde blok arası boşluk (gap-3 = 12px)

// ========== TRANSITION ==========
export const PANEL_TRANSITION_MS = 200;

// ========== OVERLAY ==========
export const RIGHT_OVERLAY_DIM_OPACITY = 0.2;

// ========== LOCAL STORAGE ==========
// v4: Independent left/right state - no mutual exclusion
export const LS_LEFT_OPEN = "spark.ui.leftOpen";
export const LS_RIGHT_OPEN = "spark.ui.rightOpen";
export const LS_RIGHT_DOCK_MODE = "spark.ui.rightDock.mode";

// Legacy keys (for migration - will be deleted after first read)
export const LEGACY_LS_LEFT_OPEN_V1 = "spark.ui.leftOpen";
export const LEGACY_LS_RIGHT_OPEN_V1 = "spark.ui.rightOpen";
export const LEGACY_LS_SIDEBAR_COLLAPSED = "ui.sidebarCollapsed.v2";
export const LEGACY_LS_RIGHT_RAIL_OPEN = "ui.rightRailOpen.v2";

// v1: Copilot dock collapse state (PATCH F)
export const LS_COPILOT_DOCK_COLLAPSED = "ui.copilotDockCollapsed.v1";

// Right dock width constants
export const RIGHT_DOCK_WIDTH_OPEN = 280;
export const RIGHT_DOCK_WIDTH_COLLAPSED = 56;

// ========== BREAKPOINTS ==========
export const OVERLAY_BREAKPOINT = 1600; // px - below this, right rail is overlay

// ========== DEFAULTS ==========
export const DEFAULT_SIDEBAR_COLLAPSED = false; // Sol panel default geniş (icon+label)
export const DEFAULT_RIGHT_RAIL_OPEN = true; // Sağ panel default açık (geniş ekran)
