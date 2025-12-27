/**
 * GoldenDashboard - Golden Master v1.0
 *
 * 1366x768 çözünürlükte ASLA scroll gerektirmeyen, yoğun veri içeren trader ekranı.
 *
 * Layout Specs:
 * - Ana Konteyner: h-full min-h-0 overflow-hidden flex flex-col
 * - Grid Sistemi: 12 Kolonlu, 3 satır explicit (fr oranlı)
 * - Boşluklar: gap-3 (12px), p-2.5 (10px) kart içi
 * - Tipografi: text-xs (12px) başlık, text-[10px]/text-sm veri, text-[9px] etiket
 * - Renk Paleti: #050608 zemin, #111318 kart, #16181d/#262626 border
 */

'use client';

import {
  IconWallet,
  IconActivity,
  IconCpu,
  IconShield,
  IconBrain,
  IconServer,
  IconMoreHorizontal
} from '../ui/LocalIcons';

export default function GoldenDashboard() {
  return (
    <div className="relative bg-[#050608] min-h-screen flex flex-col px-6 py-3">
      {/* Figma parity: Hafif radial vinyet atmosfer efekti */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.03) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59,130,246,0.02) 0%, transparent 50%)',
        }}
      />

      {/* 3 SATIRLI GRID: Explicit 2-kolon (7fr/5fr) + 3 satır - breakpoint'e az bağımlı */}
      <div className="relative z-10 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-3 grid-rows-[1.0fr_1.15fr_0.85fr] flex-1 min-h-0">

        {/* ============ SATIR 1: Portföy + Piyasa ============ */}

        {/* Sol: Portföy Özeti */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
          <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconWallet className="w-3.5 h-3.5 text-[#9ca3af]" />
              Portföy Özeti
            </h3>
            <button className="text-[#6b7280] hover:text-white transition-colors">
              <IconMoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </header>
          {/* İçerik */}
          <div className="flex-1 min-h-0 flex flex-col justify-center">
             <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0a0c0f] rounded p-2 border border-[#262626]">
                   <div className="text-[9px] text-[#6b7280]">Toplam Varlık</div>
                   <div className="text-sm text-[#e5e7eb] font-medium">$124,592.00</div>
                   <div className="text-[9px] text-[#4ade80]">+2.4%</div>
                </div>
                <div className="bg-[#0a0c0f] rounded p-2 border border-[#262626]">
                   <div className="text-[9px] text-[#6b7280]">Günlük PnL</div>
                   <div className="text-sm text-[#4ade80] font-medium">+$1,240.50</div>
                   <div className="text-[9px] text-[#6b7280]">Last 24h</div>
                </div>
                <div className="bg-[#0a0c0f] rounded p-2 border border-[#262626]">
                   <div className="text-[9px] text-[#6b7280]">Margin Level</div>
                   <div className="text-sm text-[#f97316] font-medium">1,240%</div>
                   <div className="text-[9px] text-[#6b7280]">Healthy</div>
                </div>
             </div>
          </div>
        </article>

        {/* Sağ: Piyasa Özeti */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
           <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconActivity className="w-3.5 h-3.5 text-[#9ca3af]" />
              Piyasa Durumu
            </h3>
          </header>
          <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto">
             <div className="flex items-center justify-between text-[10px] py-1 border-b border-[#262626]">
                <span className="text-[#e5e7eb]">BTC/USDT</span>
                <span className="text-[#4ade80]">42,150.00 (+1.2%)</span>
             </div>
             <div className="flex items-center justify-between text-[10px] py-1 border-b border-[#262626]">
                <span className="text-[#e5e7eb]">ETH/USDT</span>
                <span className="text-[#f97373]">2,250.00 (-0.5%)</span>
             </div>
             <div className="flex items-center justify-between text-[10px] py-1">
                <span className="text-[#e5e7eb]">SOL/USDT</span>
                <span className="text-[#4ade80]">98.50 (+5.2%)</span>
             </div>
          </div>
        </article>

        {/* ============ SATIR 2: Stratejiler + Risk ============ */}

        {/* Sol: Çalışan Stratejiler */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
           <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconCpu className="w-3.5 h-3.5 text-[#9ca3af]" />
              Aktif Stratejiler
            </h3>
            <span className="bg-[#4ade80]/10 text-[#4ade80] text-[9px] px-1.5 py-0.5 rounded">12 Running</span>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto">
             <table className="w-full text-left">
                <thead className="text-[9px] text-[#6b7280] border-b border-[#262626]">
                   <tr>
                      <th className="pb-1 font-normal">Strategy</th>
                      <th className="pb-1 font-normal">Market</th>
                      <th className="pb-1 font-normal text-right">PnL</th>
                   </tr>
                </thead>
                <tbody className="text-[10px] text-[#e5e7eb]">
                   <tr className="border-b border-[#262626]/50">
                      <td className="py-1.5">BTC Mean Rev</td>
                      <td className="py-1.5 text-[#9ca3af]">Crypto</td>
                      <td className="py-1.5 text-right text-[#4ade80]">+$450</td>
                   </tr>
                   <tr className="border-b border-[#262626]/50">
                      <td className="py-1.5">Gold Trend</td>
                      <td className="py-1.5 text-[#9ca3af]">Commodities</td>
                      <td className="py-1.5 text-right text-[#4ade80]">+$1,200</td>
                   </tr>
                   <tr>
                      <td className="py-1.5">ETH Scalp</td>
                      <td className="py-1.5 text-[#9ca3af]">Crypto</td>
                      <td className="py-1.5 text-right text-[#f97373]">-$120</td>
                   </tr>
                </tbody>
             </table>
          </div>
        </article>

        {/* Sağ: Risk & Uyarılar */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
           <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconShield className="w-3.5 h-3.5 text-[#9ca3af]" />
              Risk Durumu
            </h3>
            <span className="text-[9px] text-[#f97316]">Moderate</span>
          </header>
          <div className="flex-1 min-h-0 flex flex-col gap-2 justify-center">
             <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#9ca3af]">Daily Drawdown</span>
                <div className="flex items-center gap-2">
                   <div className="w-16 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f97316]" style={{width: '35%'}}></div>
                   </div>
                   <span className="text-[#e5e7eb] w-8 text-right">1.2%</span>
                </div>
             </div>
             <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#9ca3af]">Exposure</span>
                <div className="flex items-center gap-2">
                   <div className="w-16 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4ade80]" style={{width: '65%'}}></div>
                   </div>
                   <span className="text-[#e5e7eb] w-8 text-right">65%</span>
                </div>
             </div>
          </div>
        </article>

        {/* ============ SATIR 3: Logs / History ============ */}

        {/* Sol: Karar Geçmişi */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
           <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconBrain className="w-3.5 h-3.5 text-[#9ca3af]" />
              Son Yapay Zeka Kararları
            </h3>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto">
             <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] p-1.5 bg-[#0a0c0f] border border-[#262626] rounded">
                   <span className="text-[#e5e7eb]">BUY BTC/USDT</span>
                   <span className="text-[#9ca3af]">RSI Oversold condition met</span>
                   <span className="text-[#4ade80]">98% Conf.</span>
                </div>
                <div className="flex items-center justify-between text-[10px] p-1.5 bg-[#0a0c0f] border border-[#262626] rounded">
                   <span className="text-[#e5e7eb]">CLOSE ETH/USDT</span>
                   <span className="text-[#9ca3af]">Take profit target hit</span>
                   <span className="text-[#4ade80]">100% Conf.</span>
                </div>
             </div>
          </div>
        </article>

        {/* Sağ: Sistem Durumu */}
        <article className="min-h-0 overflow-hidden flex flex-col bg-[#111318] rounded-lg border border-[#16181d] p-2.5 gap-2">
           <header className="flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[#e5e7eb] text-xs flex items-center gap-2">
              <IconServer className="w-3.5 h-3.5 text-[#9ca3af]" />
              Sistem Sağlığı
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </header>
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-2 text-[10px]">
             <div className="flex justify-between border-b border-[#262626] pb-1">
                <span className="text-[#9ca3af]">API Latency</span>
                <span className="text-[#4ade80]">12ms</span>
             </div>
             <div className="flex justify-between border-b border-[#262626] pb-1">
                <span className="text-[#9ca3af]">Execution</span>
                <span className="text-[#4ade80]">Operational</span>
             </div>
             <div className="flex justify-between">
                <span className="text-[#9ca3af]">Data Stream</span>
                <span className="text-[#4ade80]">Connected</span>
             </div>
          </div>
        </article>

      </div>
    </div>
  );
}

