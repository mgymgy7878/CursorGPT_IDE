'use client';

import { t } from '@/lib/i18n';

const isMac = () => typeof window !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

export default function FloatingActions() {
  const handleCommandK = () => {
    // TODO: Open command palette
    console.log('Command palette');
  };

  const handleOpsHelp = () => {
    // TODO: Open ops help modal
    console.log('Ops help');
  };

  const cmdLabel = isMac() ? t('common.cmdk_mac') : t('common.cmdk_win');

  return (
    <div 
      className="fixed right-6 md:right-10 z-40 hidden md:flex gap-3 pointer-events-auto"
      style={{ 
        bottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      aria-label="Hızlı komutlar"
    >
      <button
        onClick={handleCommandK}
        className="px-3 py-2 rounded-xl bg-card hover:bg-card/80 text-white transition shadow-lg"
        aria-label={cmdLabel}
        title={cmdLabel}>
        {cmdLabel}
      </button>
      <button
        onClick={handleOpsHelp}
        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-lg"
        aria-label="Operasyon yardımı"
        title="Operasyon yardımı (Ops)">
        Ops Hızlı Yardım
      </button>
    </div>
  );
}

