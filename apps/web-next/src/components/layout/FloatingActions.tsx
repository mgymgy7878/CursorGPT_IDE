'use client';

import { usePathname } from 'next/navigation';
import { useRightRail } from './RightRailContext';

/**
 * FloatingActions - Copilot Dock Toggle (Figma Parity PATCH A)
 *
 * PATCH A: "Ops Hızlı Yardım" butonu artık Copilot dock toggle.
 * Floating button yerine topbar/handle ile entegre.
 *
 * NOT: Bu component artık kullanılmıyor, Copilot dock launcher AppFrame'de.
 * Eğer hala kullanılıyorsa, Copilot dock toggle'a yönlendir.
 */
export default function FloatingActions() {
  const pathname = usePathname();
  // Copilot dock toggle için AppFrame'deki handle kullanılmalı
  // Bu component deprecated - AppFrame'deki RightRailDock kullan

  return null; // PATCH A: Floating button kaldırıldı, Copilot dock launcher kullanılıyor
}

