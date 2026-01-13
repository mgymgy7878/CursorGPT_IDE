/**
 * Layout Token'ları - Shell Ölçüleri (Figma Parity)
 *
 * TÜM SHELL ÖLÇÜLERİ BURADAN YÖNETİLİR.
 * Figma güncellenince sadece bu değerleri değiştir.
 */

// ========== TOPBAR ==========
export const TOPBAR_HEIGHT = 56; // px - TopStatusBar yüksekliği

// ========== SIDEBAR ==========
export const SIDEBAR_EXPANDED = 240; // px - hover/focus/pinned modda tam genişlik
export const SIDEBAR_COLLAPSED = 64; // px - default ikon genişliği (hover overlay için)

// ========== RIGHT RAIL ==========
export const RIGHT_RAIL_EXPANDED = 420; // px - hover/focus/pinned modda tam genişlik (PATCH F: Copilot dock)
export const RIGHT_RAIL_COLLAPSED = 56; // px - default dock genişliği (hover overlay için)
export const RIGHT_RAIL_DOCK = 56; // px - kapalıyken icon dock genişliği (alias)
export const COPILOT_DOCK_WIDTH = 420; // px - Copilot dock genişliği (PATCH F)

// ========== HANDLE (Figma Pill Style) ==========
export const HANDLE_WIDTH = 28; // px - narrower for pill look
export const HANDLE_HEIGHT = 56; // px - taller pill
export const HANDLE_RADIUS = 14; // px - rounded-full effect

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

// ========== LOCAL STORAGE ==========
// v2: Sidebar default expanded migration (PATCH D)
export const LS_SIDEBAR_COLLAPSED = "ui.sidebarCollapsed.v2";
export const LS_RIGHT_RAIL_OPEN = "ui.rightRailOpen.v2"; // v2: 10 Ocak 2026 görünümü için versiyonlandırıldı
// v1: Copilot dock collapse state (PATCH F)
export const LS_COPILOT_DOCK_COLLAPSED = "ui.copilotDockCollapsed.v1";

// ========== DEFAULTS ==========
export const DEFAULT_SIDEBAR_COLLAPSED = false; // Sol panel default geniş (Figma parity - icon+label)
export const DEFAULT_RIGHT_RAIL_OPEN = true; // Sağ panel default açık (10 Ocak 2026 görünümü - Copilot dock görünür)
