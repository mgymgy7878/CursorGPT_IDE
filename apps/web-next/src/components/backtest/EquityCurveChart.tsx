"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';

type Props = {
  data: { timestamp: number; value: number }[];
  individual?: Array<{ symbol: string; data: { timestamp: number; value: number }[] }>;
  showIndividual?: boolean;
};

const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EquityCurveChart({ data, individual, showIndividual = false }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6 text-center opacity-50">
        Veri yok
      </div>
    );
  }

  // Downsample if > 500 points
  const downsample = (arr: any[], maxPoints = 500) => {
    if (arr.length <= maxPoints) return arr;
    const step = Math.ceil(arr.length / maxPoints);
    return arr.filter((_, i) => i % step === 0);
  };

  const chartData = downsample(data).map((d) => ({
    time: new Date(d.timestamp).toLocaleString('tr-TR', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit' 
    }),
    timestamp: d.timestamp,
    portfolio: d.value,
  }));

  // Merge individual curves if provided
  if (showIndividual && individual) {
    individual.forEach((ind, idx) => {
      const downsampled = downsample(ind.data);
      downsampled.forEach((d, i) => {
        if (chartData[i]) {
          chartData[i][ind.symbol] = d.value;
        }
      });
    });
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <h3 className="text-lg font-semibold mb-3">Equity Curve</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="#666"
            tickFormatter={(val) => `$${val.toFixed(0)}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any) => `$${value.toFixed(2)}`}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line 
            type="monotone" 
            dataKey="portfolio" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="Portföy"
          />
          {showIndividual && individual?.map((ind, idx) => (
            <Line
              key={ind.symbol}
              type="monotone"
              dataKey={ind.symbol}
              stroke={colors[idx % colors.length]}
              strokeWidth={1}
              dot={false}
              opacity={0.6}
              name={ind.symbol}
            />
          ))}
          <ReferenceLine y={10000} stroke="#666" strokeDasharray="3 3" label="Başlangıç" />
          <Brush 
            dataKey="time" 
            height={30} 
            stroke="#10b981"
            fill="#0a0a0a"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs opacity-50 mt-2 text-center">
        {data.length} veri noktası ({chartData.length} gösteriliyor)
      </div>
    </div>
  );
}

