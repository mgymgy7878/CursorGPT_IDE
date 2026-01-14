"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
// CommandPalette removed - now handled globally in app/layout.tsx via portal
const AlarmCard = dynamic(() => import("@/components/dashboard/AlarmCard"), {
  ssr: false,
});
const SmokeCard = dynamic(() => import("@/components/dashboard/SmokeCard"), {
  ssr: false,
});

const ROUTES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Observability", path: "/observability" },
  { name: "Strategy Lab", path: "/strategy-lab" },
  { name: "Audit", path: "/audit" },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Settings", path: "/settings" },
] as const;

type RouteItem = (typeof ROUTES)[number];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPopoverRef = useRef<HTMLDivElement>(null);

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSearchOpen &&
        searchPopoverRef.current &&
        !searchPopoverRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  // Mock search results (replace with real search logic)
  const searchResults = searchQuery.length > 0
    ? ROUTES.filter((route) =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const NavItem = ({ href, label }: { href: string; label: string }) => {
    const active = pathname?.startsWith(href) ?? false;
    return (
      <Link
        href={href as any}
        className={`block px-3 py-2 rounded-xl transition ${active ? "bg-neutral-800 font-semibold" : "hover:bg-neutral-800/50"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
          <Link href="/" className="font-bold">
            SPARK
          </Link>
          <div className="flex-1" />
          <div className="hidden md:block relative">
            <input
              ref={searchInputRef}
              aria-label="Global Search"
              placeholder="Ara…"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                // Query boşken popover açma
                setIsSearchOpen(value.trim().length > 0);
              }}
              onFocus={() => {
                // Query boşken popover açma
                if (searchQuery.trim().length === 0) {
                  setIsSearchOpen(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-black w-72 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Search Popover */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div
                ref={searchPopoverRef}
                className="absolute top-full left-0 mt-1 w-72 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-[100] max-h-[360px] overflow-y-auto"
                style={{ pointerEvents: 'auto' }}
              >
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-center text-popover-foreground">
                    <div className="font-medium mb-1">Sonuç yok</div>
                    <div className="text-xs mt-2 text-muted-foreground">
                      Örnek: "BTCUSDT", "BIST:THYAO"
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="block px-4 py-2 hover:bg-muted/50 transition-colors text-popover-foreground"
                      >
                        <div className="font-medium text-popover-foreground">{route.name}</div>
                        <div className="text-xs text-muted-foreground">{route.path}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* CommandPalette removed - handled globally in app/layout.tsx */}
          <div
            aria-label="Profile"
            className="w-8 h-8 rounded-full bg-neutral-800"
          />
        </div>
      </header>
      {/* PATCH: Legacy nav sidebar kaldırıldı (sol sidebar zaten nav sağlıyor) - Figma parity */}
      <div className="mx-auto max-w-[1400px] px-4 py-4 grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4">
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <aside className="md:sticky md:top-16 h-max space-y-3">
          <div className="border border-neutral-800 rounded-2xl p-3">
            <AlarmCard />
          </div>
          <div className="border border-neutral-800 rounded-2xl p-3">
            <SmokeCard />
          </div>
        </aside>
      </div>
      <a href="#main" className="sr-only focus:not-sr-only">
        İçeriğe atla
      </a>
    </div>
  );
}
