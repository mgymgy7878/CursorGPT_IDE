"use client";
import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Plus, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface AlertPreset {
  id: string;
  name: string;
  symbol: string;
  condition: 'price_above' | 'price_below' | 'volume_spike' | 'rsi_oversold' | 'rsi_overbought';
  value: number;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  action: 'alert_only' | 'create_order' | 'close_position';
  orderType?: 'market' | 'limit';
  orderSide?: 'buy' | 'sell';
  quantity?: number;
}

interface AlertPresetsProps {
  onApplyPreset: (preset: AlertPreset) => void;
  onSavePreset: (preset: Omit<AlertPreset, 'id'>) => void;
}

export default function AlertPresets({ onApplyPreset, onSavePreset }: AlertPresetsProps) {
  const [presets, setPresets] = useState<AlertPreset[]>([
    {
      id: '1',
      name: 'BTC Fiyat Düşüş Uyarısı',
      symbol: 'BTCUSDT',
      condition: 'price_below',
      value: 40000,
      timeframe: '1h',
      action: 'alert_only'
    },
    {
      id: '2',
      name: 'ETH RSI Aşırı Alım',
      symbol: 'ETHUSDT',
      condition: 'rsi_overbought',
      value: 70,
      timeframe: '15m',
      action: 'create_order',
      orderType: 'market',
      orderSide: 'sell',
      quantity: 0.1
    },
    {
      id: '3',
      name: 'Hacim Artışı + Al',
      symbol: 'ADAUSDT',
      condition: 'volume_spike',
      value: 150,
      timeframe: '5m',
      action: 'create_order',
      orderType: 'limit',
      orderSide: 'buy',
      quantity: 1000
    }
  ]);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newPreset, setNewPreset] = useState<Omit<AlertPreset, 'id'>>({
    name: '',
    symbol: '',
    condition: 'price_above',
    value: 0,
    timeframe: '1h',
    action: 'alert_only'
  });

  const handleSavePreset = () => {
    if (!newPreset.name || !newPreset.symbol) return;

    const preset: AlertPreset = {
      ...newPreset,
      id: Date.now().toString()
    };

    setPresets([...presets, preset]);
    onSavePreset(newPreset);
    setShowSaveForm(false);
    setNewPreset({
      name: '',
      symbol: '',
      condition: 'price_above',
      value: 0,
      timeframe: '1h',
      action: 'alert_only'
    });
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'price_above':
      case 'price_below':
        return <Target className="size-4" />;
      case 'volume_spike':
        return <TrendingUp className="size-4" />;
      case 'rsi_oversold':
      case 'rsi_overbought':
        return <TrendingDown className="size-4" />;
      default:
        return <Target className="size-4" />;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'price_above': return 'Fiyat üstünde';
      case 'price_below': return 'Fiyat altında';
      case 'volume_spike': return 'Hacim artışı';
      case 'rsi_oversold': return 'RSI aşırı satım';
      case 'rsi_overbought': return 'RSI aşırı alım';
      default: return condition;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'alert_only': return 'Sadece Uyarı';
      case 'create_order': return 'Emir Oluştur';
      case 'close_position': return 'Pozisyonu Kapat';
      default: return action;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Uyarı Şablonları</h3>
        <button
          onClick={() => setShowSaveForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          <Plus className="size-4" />
          Yeni Şablon
        </button>
      </div>

      {/* Presets List */}
      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:bg-neutral-750 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getConditionIcon(preset.condition)}
                <div>
                  <div className="font-medium text-white">{preset.name}</div>
                  <div className="text-sm text-neutral-400">
                    {preset.symbol} • {getConditionText(preset.condition)} • {preset.timeframe}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                  {getActionText(preset.action)}
                </span>
                <button
                  onClick={() => onApplyPreset(preset)}
                  className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg"
                  title="Uygula"
                >
                  <FolderOpen className="size-4" />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                  title="Sil"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Form Modal */}
      {showSaveForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Yeni Uyarı Şablonu</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Şablon Adı</label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="Örn: BTC Düşüş Uyarısı"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Sembol</label>
                <input
                  type="text"
                  value={newPreset.symbol}
                  onChange={(e) => setNewPreset({...newPreset, symbol: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="BTCUSDT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Koşul</label>
                  <select
                    value={newPreset.condition}
                    onChange={(e) => setNewPreset({...newPreset, condition: e.target.value as any})}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  >
                    <option value="price_above">Fiyat Üstünde</option>
                    <option value="price_below">Fiyat Altında</option>
                    <option value="volume_spike">Hacim Artışı</option>
                    <option value="rsi_oversold">RSI Aşırı Satım</option>
                    <option value="rsi_overbought">RSI Aşırı Alım</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Zaman Dilimi</label>
                  <select
                    value={newPreset.timeframe}
                    onChange={(e) => setNewPreset({...newPreset, timeframe: e.target.value as any})}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  >
                    <option value="1m">1 Dakika</option>
                    <option value="5m">5 Dakika</option>
                    <option value="15m">15 Dakika</option>
                    <option value="1h">1 Saat</option>
                    <option value="4h">4 Saat</option>
                    <option value="1d">1 Gün</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Değer</label>
                <input
                  type="number"
                  value={newPreset.value}
                  onChange={(e) => setNewPreset({...newPreset, value: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="40000"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Aksiyon</label>
                <select
                  value={newPreset.action}
                  onChange={(e) => setNewPreset({...newPreset, action: e.target.value as any})}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                >
                  <option value="alert_only">Sadece Uyarı</option>
                  <option value="create_order">Emir Oluştur</option>
                  <option value="close_position">Pozisyonu Kapat</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePreset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="size-4" />
                Kaydet
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
