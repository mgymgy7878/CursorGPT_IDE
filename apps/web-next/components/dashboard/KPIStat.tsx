'use client';

import { useRouter } from "next/navigation";

type KPIStatProps = {
  label: string;
  value?: number | string;
  fmt: 'currency' | 'delta' | 'percent' | 'text';
  degraded?: boolean;
  icon?: string;
  onClick?: () => void;
};

export default function KPIStat({ label, value, fmt, degraded, icon, onClick }: KPIStatProps) {
  const router = useRouter();

  const formatValue = (val: number | string | undefined): string => {
    if (val === undefined || val === null) return '-';
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val as number);
      
      case 'delta':
        const num = val as number;
        const prefix = num >= 0 ? '+' : '';
        return `${prefix}${new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num)}`;
      
      case 'percent':
        return new Intl.NumberFormat('tr-TR', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        }).format((val as number) / 100);
      
      case 'text':
        return String(val);
      
      default:
        return String(val);
    }
  };

  const getColorClass = (): string => {
    if (degraded) return 'text-zinc-500';
    
    if (fmt === 'delta' && typeof value === 'number') {
      return value >= 0 ? 'text-green-400' : 'text-red-400';
    }
    
    if (fmt === 'percent' && typeof value === 'number') {
      return value >= 0 ? 'text-green-400' : 'text-red-400';
    }
    
    return 'text-white';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default navigation based on label
      switch (label.toLowerCase()) {
        case 'pos/orders':
          router.push('/positions');
          break;
        case 'equity':
        case 'pnl 24h':
        case 'drawdown':
          router.push('/portfolio');
          break;
        case 'risk %':
          router.push('/settings');
          break;
      }
    }
  };

  return (
    <div
      className={`p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 cursor-pointer transition-colors hover:bg-zinc-800 ${
        degraded ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className={`text-lg font-semibold ${getColorClass()}`}>
        {formatValue(value)}
      </div>
      {degraded && (
        <div className="text-xs text-yellow-400 mt-1">DEGRADED</div>
      )}
    </div>
  );
} 