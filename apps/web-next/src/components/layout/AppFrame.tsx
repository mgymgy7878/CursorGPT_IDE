/**
 * AppFrame - Shell Anayasası
 *
 * Tüm shell yapısı (TopStatusBar + LeftNav + RightRail + Main) burada tanımlı.
 * Sayfalar shell'e dokunmaz; sadece main içeriği verir.
 *
 * KURAL: Shell yapısı sadece burada değiştirilir. Sayfa layout'ları shell'e dokunmaz.
 */

'use client';

import StatusBar from '@/components/status-bar';
import LeftNav from '@/components/left-nav';
import { useRightRail } from './RightRailContext';
import { ReactNode } from 'react';

interface AppFrameProps {
  children: ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  const rightRail = useRightRail();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* TopStatusBar */}
      <StatusBar />

      {/* Main Layout: LeftNav + Main + RightRail */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LeftNav - Global Navigation */}
        <LeftNav />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>

        {/* RightRail - Her zaman rezerve edilir (içerik yoksa Copilot skeleton) */}
        <aside className="w-[380px] shrink-0 border-l border-neutral-800 bg-neutral-950/50 overflow-hidden flex flex-col">
          {rightRail || <RightRailCopilotSkeleton />}
        </aside>
      </div>
    </div>
  );
}

/**
 * RightRail Copilot Skeleton - Figma Parity v0
 *
 * Figma'daki Copilot panel görünümüne yaklaş:
 * - Header (SPARK COPILOT + Canlı badge)
 * - Model bilgisi
 * - Sistem/Strateji/Risk modu özeti
 * - Hızlı aksiyon butonları
 * - Chat body placeholder
 * - Input bar
 */
function RightRailCopilotSkeleton() {
  return (
    <div className="h-full flex flex-col bg-neutral-950/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-neutral-200">SPARK COPILOT</h2>
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs">
            Canlı
          </span>
        </div>
        <div className="text-xs text-neutral-400 space-y-0.5">
          <div>Ana AI Trader - Global Yönetici</div>
          <div>Model: ChatGPT 5.1 - Trader</div>
        </div>
      </div>

      {/* System Info */}
      <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/30">
        <div className="text-xs text-neutral-400 space-y-1">
          <div>Sistem: Normal</div>
          <div>Strateji: BTCUSDT - Trend Follower v1</div>
          <div>Risk modu: Shadow</div>
        </div>
      </div>

      {/* Quick Actions - Chip/Segmented style (Figma parity: daha ince border/opacity, daha düşük doluluk) */}
      <div className="px-4 py-2 border-b border-neutral-800">
        <div className="flex flex-wrap gap-1.5">
          <button className="px-2.5 py-1 text-xs bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-300/90 rounded-full transition-colors leading-tight">
            Portföy riskini analiz et
          </button>
          <button className="px-2.5 py-1 text-xs bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-300/90 rounded-full transition-colors leading-tight">
            Çalışan stratejileri özetle
          </button>
          <button className="px-2.5 py-1 text-xs bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-300/90 rounded-full transition-colors leading-tight">
            Bugün için işlem önerisi
          </button>
        </div>
      </div>

      {/* Chat Body (Placeholder) */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
            <div className="text-xs text-neutral-300 mb-1">Copilot</div>
            <div className="text-sm text-neutral-400 leading-relaxed">
              Merhaba, ben Spark Copilot. Portföy durumunu, çalışan stratejileri ve risk limitlerini izliyorum. İstersen önce genel portföy riskini çıkarabilirim.
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder='Örn: "Bugünkü piyasa rejimine göre BTCUSDT için trade planı üret"'
            className="flex-1 px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            disabled
          />
          <button
            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
            disabled
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

