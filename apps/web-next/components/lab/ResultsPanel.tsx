'use client';

import { useState } from "react";
import { Eye, Download, BarChart3 } from "lucide-react";

export default function ResultsPanel() {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Mock results data
  const mockResults = [
    {
      id: 'res_001',
      type: 'backtest',
      name: 'RSI Strategy v1',
      date: '2024-01-20 10:30',
      metrics: {
        totalReturn: '+15.2%',
        sharpeRatio: '1.8',
        maxDrawdown: '-3.1%',
        winRate: '68%'
      }
    },
    {
      id: 'res_002',
      type: 'optimize',
      name: 'MACD Optimization',
      date: '2024-01-19 14:15',
      metrics: {
        bestParams: 'Fast: 12, Slow: 26, Signal: 9',
        improvement: '+8.5%',
        iterations: '150'
      }
    }
  ];

  const handleViewResult = (result: any) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const handleDownloadResult = (result: any) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${result.id}_${result.date.split(' ')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Sonuçlar</h2>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Tüm sonuçlar</span>
          </div>
        </div>

        {mockResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz sonuç bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {mockResults.map((result) => (
              <div key={result.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`px-2 py-1 text-xs rounded ${
                        result.type === 'backtest' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                      }`}>
                        {result.type === 'backtest' ? 'Backtest' : 'Optimize'}
                      </div>
                      <h3 className="text-white font-medium">{result.name}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">
                      {result.date}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(result.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewResult(result)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                      aria-label="Sonucu görüntüle"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Görüntüle</span>
                    </button>
                    <button
                      onClick={() => handleDownloadResult(result)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                      aria-label="Sonucu indir"
                    >
                      <Download className="w-3 h-3" />
                      <span>İndir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Modal */}
      {showModal && selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedResult.name} - Sonuç Detayı
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-gray-800 rounded border border-gray-700 p-4 overflow-auto max-h-[60vh]">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(selectedResult, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => handleDownloadResult(selectedResult)}
                className="btn-secondary"
              >
                İndir
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-primary"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 