"use client";

export default function SidebarNav() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">SPARK</h1>
      </div>
      
      <nav className="space-y-6">
        {/* GENEL */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">GENEL</h3>
          <div className="space-y-2">
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>📊</span>
              <span>Anasayfa</span>
            </a>
            <a href="/portfolio" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>💼</span>
              <span>Portföy</span>
            </a>
          </div>
        </div>

        {/* TEKNİK ANALİZ */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">TEKNİK ANALİZ</h3>
          <div className="space-y-2">
            <a href="/technical-analysis" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>📈</span>
              <span>Analiz</span>
            </a>
            <a href="/alerts" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>🔔</span>
              <span>Uyarılar</span>
            </a>
          </div>
        </div>

        {/* STRATEJİ & BACKTEST */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">STRATEJİ & BACKTEST</h3>
          <div className="space-y-2">
            <a href="/strategies" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>📋</span>
              <span>Stratejilerim</span>
            </a>
            <a href="/strategy-lab" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>🧪</span>
              <span>Strategy Lab</span>
            </a>
            <a href="/backtest-lab" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>📊</span>
              <span>Backtest Lab</span>
            </a>
          </div>
        </div>

        {/* AYARLAR */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">SİSTEM</h3>
          <div className="space-y-2">
            <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors">
              <span>⚙️</span>
              <span>Ayarlar</span>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
