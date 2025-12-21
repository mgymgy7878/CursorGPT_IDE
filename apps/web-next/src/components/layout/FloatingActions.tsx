'use client';

import { usePathname } from 'next/navigation';

/**
 * FloatingActions - Tek Otorite FAB'lar (Figma Parity v2)
 *
 * KURAL: Command Palette (⌘K) TopStatusBar'da zaten var.
 * Bu component sadece "Ops Hızlı Yardım" FAB'ını içerir.
 * Aynı aksiyon iki yerde görünmez.
 *
 * GOLDEN MASTER: Dashboard'da FAB gizlenir (ekran yoğunluğu).
 *
 * DYNAMIC: ResizeObserver ile ölçülen --composer-h değişkeni kullanılıyor
 * Composer büyür/küçülürken FAB otomatik yukarı/aşağı kayar.
 */
export default function FloatingActions() {
  const pathname = usePathname();

  // Golden Master v1.0: Dashboard'da FAB gizle
  const isDashboard = pathname === '/dashboard' || pathname === '/';

  const handleOpsHelp = () => {
    // TODO: Open ops help modal/drawer
    console.log('Ops help');
  };

  // Dashboard'da FAB yok (ekran yoğunluğu için)
  if (isDashboard) {
    return null;
  }

  return (
    <div
      className="fixed z-40 hidden md:flex flex-col gap-2 pointer-events-auto"
      style={{
        right: 'max(24px, calc(100vw - var(--main-content-width, 100vw) + 24px))',
        bottom: 'calc(24px + var(--composer-h, 72px))'
      }}
      aria-label="Hızlı komutlar"
    >
      {/* Tek FAB: Ops Hızlı Yardım - ⌘K Commands TopStatusBar'da */}
      <button
        onClick={handleOpsHelp}
        className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-lg whitespace-nowrap text-sm font-medium"
        aria-label="Operasyon yardımı"
        title="Operasyon yardımı (Ops Dokümantasyon)">
        Ops Hızlı Yardım
      </button>
    </div>
  );
}

