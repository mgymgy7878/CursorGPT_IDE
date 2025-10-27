'use client';

import { useState } from "react";
import { postPublic } from "@/lib/client";

export default function QuickActions() {
  const [saving, setSaving] = useState(false);
  const [currentMode, setCurrentMode] = useState<'grid' | 'trend' | 'scalp'>('trend');
  const [currentRisk, setCurrentRisk] = useState(0.5);
  const [isRunning, setIsRunning] = useState(false);

  const setMode = async (mode: 'grid' | 'trend' | 'scalp') => {
    setSaving(true);
    try {
      await postPublic('/api/public/manager/strategy-mode', { mode });
      setCurrentMode(mode);
      // Show success toast
      console.log(`Rejim ${mode} olarak ayarlandı`);
    } catch (error) {
      console.error('Rejim değiştirme hatası:', error);
      // Show error toast
    } finally {
      setSaving(false);
    }
  };

  const setRisk = async (risk: number) => {
    setSaving(true);
    try {
      await postPublic('/api/public/manager/risk', { pct: risk });
      setCurrentRisk(risk);
      console.log(`Risk %${risk} olarak ayarlandı`);
    } catch (error) {
      console.error('Risk ayarlama hatası:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRunning = async () => {
    setSaving(true);
    try {
      if (isRunning) {
        await postPublic('/api/public/manager/stop', {});
        setIsRunning(false);
        console.log('Trading durduruldu');
      } else {
        await postPublic('/api/public/manager/start', {});
        setIsRunning(true);
        console.log('Trading başlatıldı');
      }
    } catch (error) {
      console.error('Trading toggle hatası:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Rejim Seçimi */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Trading Rejimi</label>
        <div className="flex gap-2">
          {(['grid', 'trend', 'scalp'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              disabled={saving}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentMode === mode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode === 'grid' && 'Grid'}
              {mode === 'trend' && 'Trend'}
              {mode === 'scalp' && 'Scalp'}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Ayarı */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Risk Yüzdesi</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={currentRisk}
            onChange={(e) => setRisk(parseFloat(e.target.value))}
            disabled={saving}
            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-medium text-zinc-300 min-w-[3rem]">
            %{currentRisk}
          </span>
          <button
            onClick={() => setRisk(currentRisk)}
            disabled={saving}
            className={`px-3 py-1 rounded text-sm ${
              saving
                ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Uygula
          </button>
        </div>
      </div>

      {/* Start/Stop */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Trading Durumu</label>
        <button
          onClick={toggleRunning}
          disabled={saving}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isRunning
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'İşleniyor...' : isRunning ? 'Durdur' : 'Başlat'}
        </button>
      </div>

      {/* Son Stratejiyi Çalıştır */}
      <div>
        <button
          onClick={() => {
            // TODO: Implement last strategy execution
            console.log('Son strateji çalıştırılıyor...');
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Son Stratejiyi Çalıştır
        </button>
      </div>
    </div>
  );
} 