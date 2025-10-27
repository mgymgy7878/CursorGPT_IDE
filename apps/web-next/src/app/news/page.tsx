"use client";
import { useEffect, useState } from 'react';

interface KAPSignal {
  id: string;
  title: string;
  company: string;
  date: string;
  topic: string;
  impact: number;
  confidence: number;
  horizon: string;
  suggestion: string;
}

export default function NewsPage() {
  const [signals, setSignals] = useState<KAPSignal[]>([]);
  const [loading, setLoading] = useState(false);

  async function scanKAP() {
    setLoading(true);
    try {
      const res = await fetch('/api/kap/scan', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSignals(data.signals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scanKAP();
  }, []);

  const getImpactBadge = (impact: number) => {
    if (impact > 0) {
      return 'bg-green-900/50 text-green-300';
    } else if (impact < 0) {
      return 'bg-red-900/50 text-red-300';
    }
    return 'bg-neutral-800 text-neutral-300';
  };

  const getImpactLabel = (impact: number) => {
    if (impact > 0) return '📈 Pozitif';
    if (impact < 0) return '📉 Negatif';
    return '⚪ Nötr';
  };

  const getTopicBadge = (topic: string) => {
    const colors: Record<string, string> = {
      FINANCIAL_RESULTS: 'bg-blue-900/50 text-blue-300',
      DIVIDEND: 'bg-green-900/50 text-green-300',
      BUYBACK: 'bg-cyan-900/50 text-cyan-300',
      CAPEX: 'bg-purple-900/50 text-purple-300',
      DEBT: 'bg-orange-900/50 text-orange-300',
      LEGAL_RISK: 'bg-red-900/50 text-red-300',
      PROJECT_WIN: 'bg-lime-900/50 text-lime-300',
      MANAGEMENT_CHANGE: 'bg-yellow-900/50 text-yellow-300',
      OTHER: 'bg-neutral-800 text-neutral-300',
    };
    return colors[topic] || 'bg-neutral-800 text-neutral-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📰 Haber / KAP</h1>
        <p className="text-neutral-400">
          Kamuyu Aydınlatma Platformu (KAP) bildirimleri ve NLP analizi
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={scanKAP}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Taranıyor...' : '🔍 KAP Tara'}
        </button>
        <div className="flex-1" />
        <div className="text-sm text-neutral-500 flex items-center">
          Toplam: {signals.length} bildirim
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 p-4">
          <div className="text-xs opacity-70 mb-1">Pozitif</div>
          <div className="text-3xl font-bold text-green-400">
            {signals.filter((s) => s.impact > 0).length}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800 p-4">
          <div className="text-xs opacity-70 mb-1">Nötr</div>
          <div className="text-3xl font-bold text-neutral-400">
            {signals.filter((s) => s.impact === 0).length}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800 p-4">
          <div className="text-xs opacity-70 mb-1">Negatif</div>
          <div className="text-3xl font-bold text-red-400">
            {signals.filter((s) => s.impact < 0).length}
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {signals.length === 0 && !loading && (
          <div className="text-center py-12 text-neutral-500">
            KAP bildirimi bulunamadı. Tarama başlatmak için yukarıdaki butona tıklayın.
          </div>
        )}

        {signals.map((signal, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-800 p-4 hover:bg-neutral-900/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono font-bold">{signal.company}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${getTopicBadge(signal.topic)}`}>
                    {signal.topic.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${getImpactBadge(signal.impact)}`}>
                    {getImpactLabel(signal.impact)}
                  </span>
                </div>
                <div className="text-sm mb-2">{signal.title}</div>
                <div className="text-xs text-neutral-400">{signal.date}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Güven</div>
                <div className="text-2xl font-bold">{Math.round(signal.confidence * 100)}%</div>
              </div>
            </div>

            {/* Suggestion */}
            <div className="rounded-lg bg-neutral-900/50 border border-neutral-800 p-3">
              <div className="text-xs text-neutral-500 mb-1">AI Önerisi</div>
              <div className="text-sm">{signal.suggestion}</div>
            </div>

            <div className="mt-2 text-xs text-neutral-500">
              Ufuk: {signal.horizon}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-neutral-800 p-6 bg-blue-900/10">
        <div className="text-sm text-blue-300 mb-2">ℹ️ Bilgilendirme</div>
        <div className="text-xs text-neutral-400">
          Bu analizler NLP (Doğal Dil İşleme) ile otomatik olarak üretilmiştir ve yalnızca
          bilgilendirme amaçlıdır. Yatırım kararlarınızı verirken profesyonel danışmanlık
          almanızı öneririz.
        </div>
      </div>
    </div>
  );
}

