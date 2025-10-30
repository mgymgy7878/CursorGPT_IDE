"use client";
import React, { useState } from 'react';
import { Trash2, Target, Shield, TrendingUp, X, Check } from 'lucide-react';

interface BulkActionsProps {
  selectedPositions: string[];
  onBulkCancel: () => void;
  onBulkTPSL: (type: 'tp' | 'sl', percentage: number) => void;
  onBulkClose: () => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedPositions,
  onBulkCancel,
  onBulkTPSL,
  onBulkClose,
  onClearSelection
}: BulkActionsProps) {
  const [showTPSLModal, setShowTPSLModal] = useState(false);
  const [tpslType, setTpslType] = useState<'tp' | 'sl'>('tp');
  const [tpslPercentage, setTpslPercentage] = useState(2);

  if (selectedPositions.length === 0) return null;

  const handleTPSL = () => {
    onBulkTPSL(tpslType, tpslPercentage);
    setShowTPSLModal(false);
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="sticky top-0 bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{selectedPositions.length}</span>
              </div>
              <span className="text-white font-medium">
                {selectedPositions.length} pozisyon seçildi
              </span>
            </div>
            <div className="text-sm text-blue-300">
              {selectedPositions.join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkCancel}
              className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm"
              title="Bekleyen Emirleri İptal Et"
            >
              <Trash2 className="size-4" />
              Toplu İptal
            </button>

            <button
              onClick={() => setShowTPSLModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm"
              title="TP/SL Ekle"
            >
              <Target className="size-4" />
              TP/SL Ekle
            </button>

            <button
              onClick={onBulkClose}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg text-sm"
              title="Pozisyonları Kapat"
            >
              <X className="size-4" />
              Toplu Kapat
            </button>

            <button
              onClick={onClearSelection}
              className="p-2 text-neutral-400 hover:text-white"
              title="Seçimi Temizle"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TP/SL Modal */}
      {showTPSLModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Toplu TP/SL Ekle</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">TP/SL Türü</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTpslType('tp')}
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      tpslType === 'tp'
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    <TrendingUp className="size-4" />
                    Take Profit
                  </button>
                  <button
                    onClick={() => setTpslType('sl')}
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      tpslType === 'sl'
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Shield className="size-4" />
                    Stop Loss
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Yüzde</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setTpslPercentage(pct)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        tpslPercentage === pct
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={tpslPercentage}
                  onChange={(e) => setTpslPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full mt-2 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="Özel yüzde"
                />
              </div>

              <div className="bg-neutral-700/50 rounded-lg p-3">
                <div className="text-sm text-neutral-400 mb-1">Seçilen Pozisyonlar:</div>
                <div className="text-xs text-neutral-300">
                  {selectedPositions.join(', ')}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {tpslType === 'tp' ? 'Take Profit' : 'Stop Loss'} %{tpslPercentage} uygulanacak
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTPSL}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="size-4" />
                Uygula
              </button>
              <button
                onClick={() => setShowTPSLModal(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
