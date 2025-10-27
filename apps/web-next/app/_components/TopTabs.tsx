'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',                 label: 'Anasayfa' },
  { href: '/gozlem',           label: 'Gözlem' },
  { href: '/portfoy',          label: 'Portföy' },
  { href: '/strategies',       label: 'Stratejilerim' },
  { href: '/lab',              label: 'Strategy Lab' },
  { href: '/ops',              label: 'Ops' },
  { href: '/ayarlar',          label: 'Ayarlar' }
];

export default function TopTabs() {
  const pathname = usePathname() || '/';
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-900/80 backdrop-blur">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        <ul className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {TABS.map(t => {
            const active = pathname === t.href || (t.href !== '/' && pathname.startsWith(t.href));
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={[
                    'inline-flex items-center rounded-xl px-3 py-1.5 text-sm transition',
                    active
                      ? 'bg-emerald-600/90 text-white'
                      : 'text-neutral-200 hover:bg-neutral-800'
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
