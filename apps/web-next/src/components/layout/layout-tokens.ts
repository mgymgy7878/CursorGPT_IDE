/**
 * Layout Token'ları - Shell Ölçüleri (Figma Parity)
 *
 * TÜM SHELL ÖLÇÜLERİ BURADAN YÖNETİLİR.
 * Figma güncellenince sadece bu değerleri değiştir.
 */

// ========== TOPBAR ==========
export const TOPBAR_HEIGHT = 56;  // px - TopStatusBar yüksekliği

// ========== SIDEBAR ==========
export const SIDEBAR_EXPANDED = 240;  // px - hover/focus/pinned modda tam genişlik
export const SIDEBAR_COLLAPSED = 64;  // px - default ikon genişliği (hover overlay için)

// ========== RIGHT RAIL ==========
export const RIGHT_RAIL_EXPANDED = 420;  // px - hover/focus/pinned modda tam genişlik
export const RIGHT_RAIL_COLLAPSED = 56;  // px - default dock genişliği (hover overlay için)
export const RIGHT_RAIL_DOCK = 56;  // px - kapalıyken icon dock genişliği (alias)

// ========== HANDLE (Figma Pill Style) ==========
export const HANDLE_WIDTH = 28;  // px - narrower for pill look
export const HANDLE_HEIGHT = 56; // px - taller pill
export const HANDLE_RADIUS = 14; // px - rounded-full effect

// ========== DIVIDER ==========
export const DIVIDER_WIDTH = 1;  // px

// ========== PAGE LAYOUT ==========
export const PAGE_PAD_X = 24;  // px - sayfa yatay padding
export const PAGE_PAD_TOP = 24;  // px - sayfa üst padding
export const HEADER_GAP = 16;  // px - header ile içerik arası

// ========== CARDS ==========
export const CARD_RADIUS = 12;  // px - kart border-radius
export const CARD_PAD = 16;  // px - kart iç padding

// ========== TRANSITION ==========
export const PANEL_TRANSITION_MS = 200;

// ========== LOCAL STORAGE ==========
export const LS_SIDEBAR_COLLAPSED = 'ui.sidebarCollapsed';
export const LS_RIGHT_RAIL_OPEN = 'ui.rightRailOpen';

// ========== DEFAULTS ==========
export const DEFAULT_SIDEBAR_COLLAPSED = true;  // Sol panel default dar
export const DEFAULT_RIGHT_RAIL_OPEN = true;    // Sağ panel default açık

