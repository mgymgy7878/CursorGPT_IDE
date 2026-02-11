/**
 * Sparkline - Mini chart component for MarketData table
 *
 * SVG-based sparkline with trend coloring based on actual change value:
 * - Green + upward: change > 0
 * - Red + downward: change < 0
 * - Neutral: change == 0
 */

'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Override trend color based on actual change value */
  isPositive?: boolean;
}

export function Sparkline({ data, width = 80, height = 24, className, isPositive }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} />;
  }

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Padding for better visualization (8% of range)
  const paddingRatio = 0.08;
  const paddedMin = min - range * paddingRatio;
  const paddedMax = max + range * paddingRatio;
  const paddedRange = paddedMax - paddedMin || 1;

  // Build SVG path (smoother than polyline)
  const pathData = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  // Last point coordinates for circle marker
  const lastIndex = data.length - 1;
  const lastX = padding + (lastIndex / (data.length - 1)) * chartWidth;
  const lastY = padding + chartHeight - ((data[lastIndex] - paddedMin) / paddedRange) * chartHeight;

  // Trend color: use isPositive prop if provided, otherwise compare first and last values
  const trend = isPositive !== undefined
    ? isPositive
    : data[data.length - 1] >= data[0];

  const strokeColor = trend ? '#4ade80' : '#f87171'; // green-400 / red-400

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Minimal area fill gradient (Figma parity: very subtle) */}
      <defs>
        <linearGradient id={`sparkline-gradient-${trend ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Optional area fill (very subtle) */}
      <path
        d={`${pathData} L ${lastX} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`}
        fill={`url(#sparkline-gradient-${trend ? 'green' : 'red'})`}
        opacity="0.5"
      />

      {/* Sparkline path - thin stroke (Figma parity: 1.5px) */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Last point marker (Figma parity - small dot) */}
      <circle
        cx={lastX}
        cy={lastY}
        r="2"
        fill={strokeColor}
        stroke="var(--app-bg, #0a0a0a)"
        strokeWidth="1"
        opacity="0.95"
      />
    </svg>
  );
}

/**
 * Generate deterministic sparkline data that matches the change direction
 *
 * @param seed - Symbol string for deterministic randomness
 * @param isPositive - Whether the change is positive (upward trend) or negative (downward)
 * @param length - Number of data points
 */
export function generateMockSparklineData(seed: string, isPositive: boolean, length = 24): number[] {
  // Simple deterministic pseudo-random based on string seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const data: number[] = [];
  const startValue = 100 + (Math.abs(hash) % 30);

  // Ensure the trend matches the change direction
  // If positive: end > start, if negative: end < start
  const trendBias = isPositive ? 0.6 : -0.6; // Bias toward the trend direction

  let value = startValue;

  for (let i = 0; i < length; i++) {
    // Deterministic noise based on seed
    const noise = (((hash * (i + 1)) % 100) - 50) / 100; // -0.5 to 0.5

    // Combine trend bias with noise, scaled by position in the series
    const progressFactor = i / (length - 1); // 0 to 1
    const change = (trendBias * progressFactor * 15) + (noise * 3);

    value = Math.max(50, Math.min(150, value + change));
    data.push(value);

    hash = ((hash << 5) - hash) + i;
    hash = hash & hash;
  }

  // Final adjustment to ensure trend direction is correct
  const actualTrend = data[data.length - 1] > data[0];
  if (actualTrend !== isPositive) {
    // Flip the data if trend doesn't match
    return data.reverse();
  }

  return data;
}

export default Sparkline;
