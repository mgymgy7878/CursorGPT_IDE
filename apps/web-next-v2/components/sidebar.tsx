'use client';

import Link from 'next/link';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';

export function Sidebar() {
  return (
    <nav aria-label="Ana menü" className="p-4">
      <NavigationMenu orientation="vertical" className="w-full">
        <NavigationMenuList className="flex flex-col gap-2">
          {[
            { href: '/dashboard', label: 'Anasayfa' },
            { href: '/strategies', label: 'Stratejiler' },
            { href: '/portfolio', label: 'Portföy' },
            { href: '/alerts', label: 'Uyarılar' },
            { href: '/risk', label: 'Risk/Koruma' },
            { href: '/settings', label: 'Ayarlar' },
          ].map((item) => (
            <NavigationMenuItem key={item.href} className="rounded-xl hover:bg-white/5">
              <Link href={item.href} className="block px-3 py-2 min-h-[24px]">
                {item.label}
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}

