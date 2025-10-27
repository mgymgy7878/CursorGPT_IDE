"use client";

type Props = {
  matrix: number[][];
  symbols: string[];
  threshold?: number;
};

export default function CorrelationHeatmap({ matrix, symbols, threshold = 0.7 }: Props) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6 text-center opacity-50">
        Korelasyon verisi yok
      </div>
    );
  }

  const getColor = (val: number) => {
    if (val === 1.0) return 'bg-neutral-700'; // Diagonal
    if (val > 0.8) return 'bg-red-700';
    if (val > 0.6) return 'bg-orange-600';
    if (val > 0.4) return 'bg-yellow-600';
    if (val > 0.2) return 'bg-green-600';
    if (val > 0) return 'bg-blue-600';
    if (val > -0.2) return 'bg-blue-700';
    return 'bg-purple-700';
  };

  const avgCorrelation = 
    matrix.reduce((sum, row, i) => 
      sum + row.reduce((s, val, j) => i < j ? s + val : s, 0), 0
    ) / ((matrix.length * (matrix.length - 1)) / 2);

  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Korelasyon Matrisi</h3>
        <div className="text-sm">
          <span className="opacity-70">Ortalama:</span>{' '}
          <span className={avgCorrelation > threshold ? 'text-orange-400 font-semibold' : 'text-green-400 font-semibold'}>
            {avgCorrelation.toFixed(3)}
          </span>
          {avgCorrelation > threshold && (
            <span className="ml-2 text-xs text-orange-400">⚠️ Yüksek</span>
          )}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs opacity-50"></th>
              {symbols.map((sym) => (
                <th key={sym} className="p-2 text-xs opacity-70">
                  {sym.replace('USDT', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="p-2 text-xs opacity-70 font-semibold">
                  {symbols[i].replace('USDT', '')}
                </td>
                {row.map((val, j) => (
                  <td key={j} className="p-0">
                    <div
                      className={`p-3 text-center text-sm font-semibold ${getColor(val)} ${
                        i === j ? 'opacity-40' : ''
                      }`}
                      title={`${symbols[i]} vs ${symbols[j]}: ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs opacity-50 space-y-1">
        <div className="flex gap-4 flex-wrap">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-700 rounded"></div>
            &gt; 0.8 (Çok yüksek)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            0.6-0.8 (Yüksek)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded"></div>
            0.4-0.6 (Orta)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            0.2-0.4 (Düşük)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            0-0.2 (Çok düşük)
          </span>
        </div>
      </div>
    </div>
  );
}

