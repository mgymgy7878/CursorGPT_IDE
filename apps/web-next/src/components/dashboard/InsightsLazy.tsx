'use client';
import { useVisible } from '@/lib/useVisible';
import dynamic from 'next/dynamic';
const AlarmCard = dynamic(()=>import('@/components/dashboard/AlarmCard'), { ssr:false });
const SmokeCard = dynamic(()=>import('@/components/dashboard/SmokeCard'), { ssr:false });

export default function InsightsLazy(){
  const { ref, visible } = useVisible<HTMLDivElement>();
  return (
    <div ref={ref} className="space-y-3">
      {!visible ? (
        <div className="space-y-3">
          <div className="animate-pulse h-40 rounded-2xl border border-neutral-800" />
          <div className="animate-pulse h-40 rounded-2xl border border-neutral-800" />
        </div>
      ) : (
        <>
          <div className="border border-neutral-800 rounded-2xl p-3"><AlarmCard /></div>
          <div className="border border-neutral-800 rounded-2xl p-3"><SmokeCard /></div>
        </>
      )}
    </div>
  );
}


