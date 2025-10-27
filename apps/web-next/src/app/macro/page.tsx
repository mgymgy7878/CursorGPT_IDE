"use client";
import { useEffect, useState } from 'react';

interface RateExpectation {
  bank: string;
  expectedBps: number;
  expectedBias: string;
  decisionTime: string;
}

export default function MacroPage() {
  const [upcoming, setUpcoming] = useState<RateExpectation[]>([]);

  useEffect(() => {
    fetch('/api/macro/rate/upcoming')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUpcoming(data.upcoming || []);
        }
      })
      .catch(console.error);
  }, []);

  const getBankBadge = (bank: string) => {
    const colors: Record<string, string> = {
      TCMB: 'bg-red-900/50 text-red-300',
      FED: 'bg-blue-900/50 text-blue-300',
      ECB: 'bg-purple-900/50 text-purple-300',
      BOE: 'bg-green-900/50 text-green-300',
    };
    return colors[bank] || 'bg-neutral-800';
  };

  const getBiasBadge = (bias: string) => {
    switch (bias) {
      case 'hike':
        return 'bg-red-900/50 text-red-300';
      case 'cut':
        return 'bg-green-900/50 text-green-300';
      default:
        return 'bg-neutral-800 text-neutral-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📅 Makro Takvim</h1>
        <p className="text-neutral-400">
          Merkez bankası kararları ve ekonomik veri takvimi
        </p>
      </div>

      {/* Upcoming Decisions */}
      <div className="rounded-2xl border border-neutral-800 p-6">
        <h2 className="text-xl font-bold mb-4">Yaklaşan Faiz Kararları</h2>

        {upcoming.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            Henüz planlanmış faiz kararı yok.
            <div className="mt-4 text-sm">
              <code className="bg-neutral-900 px-3 py-1 rounded">
                POST /macro/rate/expectations
              </code>
              <span className="mx-2">ile yeni beklenti ekleyebilirsiniz</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {upcoming.map((exp, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 p-4 hover:bg-neutral-900/50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-3 py-1 rounded-lg font-bold ${getBankBadge(exp.bank)}`}>
                      {exp.bank}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-lg ${getBiasBadge(exp.expectedBias)}`}>
                      {exp.expectedBias === 'hike' ? '📈 Artış' : exp.expectedBias === 'cut' ? '📉 İndirim' : '⏸️ Sabit'}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-400">
                    {new Date(exp.decisionTime).toLocaleString('tr-TR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500">Beklenen</div>
                  <div className="text-2xl font-bold">{exp.expectedBps} bps</div>
                </div>
              </div>

              {/* Countdown */}
              <div className="mt-3 pt-3 border-t border-neutral-800">
                <div className="text-xs text-neutral-500">
                  {(() => {
                    const now = new Date();
                    const decision = new Date(exp.decisionTime);
                    const diff = decision.getTime() - now.getTime();
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    return `${days} gün ${hours} saat kaldı`;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Calendar (Placeholder) */}
      <div className="rounded-2xl border border-neutral-800 p-6">
        <h2 className="text-xl font-bold mb-4">Ekonomik Veri Takvimi</h2>
        <div className="text-center py-8 text-neutral-500">
          <div className="mb-2">📊 Yakında</div>
          <div className="text-sm">
            TÜİK CPI/PPI, ABD NFP, PMI gibi veriler burada görünecek
          </div>
        </div>
      </div>

      {/* Impact Scenarios (Placeholder) */}
      <div className="rounded-2xl border border-neutral-800 p-6">
        <h2 className="text-xl font-bold mb-4">Etki Senaryoları</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="font-bold mb-2">TCMB Hawkish Sürpriz</div>
            <div className="text-sm text-neutral-400 mb-3">
              Beklenenden yüksek faiz artışı
            </div>
            <div className="text-xs space-y-1">
              <div>USDTRY: <span className="text-green-400">↓ Düşüş beklenir</span></div>
              <div>XBANK: <span className="text-green-400">↑ Yükseliş beklenir</span></div>
              <div>XU100: <span className="text-yellow-400">~ Karışık</span></div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="font-bold mb-2">FED Hawkish Sürpriz</div>
            <div className="text-sm text-neutral-400 mb-3">
              Beklenenden yüksek faiz artışı
            </div>
            <div className="text-xs space-y-1">
              <div>DXY: <span className="text-green-400">↑ Yükseliş beklenir</span></div>
              <div>BTCUSDT: <span className="text-red-400">↓ Düşüş beklenir</span></div>
              <div>XU100: <span className="text-red-400">↓ Düşüş beklenir</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

