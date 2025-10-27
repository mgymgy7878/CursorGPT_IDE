export type NavItem = { href: string; label: string; icon?: string };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/btcturk",   label: "BTCTurk (Kripto)" },
  { href: "/bist",      label: "BIST (Hisse)" },
  { href: "/strategies",label: "Stratejilerim" },
  { href: "/active-strategies", label: "Çalışan Stratejiler" },
  { href: "/lab",       label: "Strateji Lab" },
  { href: "/portfolio", label: "Portföy" },
  { href: "/settings",  label: "Ayarlar" },
]; 
