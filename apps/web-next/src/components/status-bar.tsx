"use client";

import Link from "next/link";
import { StatusDot } from "./status-dot";
import { useUnifiedStatus } from "@/hooks/useUnifiedStatus";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useTranslation } from "@/hooks/useTranslation";
import { fmtPct } from "@/lib/format";

export default function StatusBar() {
  const { api, ws, executor } = useUnifiedStatus();
  const { data } = useHeartbeat();
  const t = useTranslation();

  // Dev/mock mode kontrolü
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  const isMock = process.env.NEXT_PUBLIC_MOCK === '1';
  const isDevMode = isDev || isMock;

  // Tek canlı bölge için durum mesajı
  const getLiveMessage = () => {
    if (isDevMode) {
      return t('service.dev_mode') + ' ' + t('service.dev_mode_desc');
    }
    
    if (ws === 'up') {
      return t('service.ws_connected');
    }
    
    return t('service.ws_disconnected');
  };

  return (
    <div
      className="w-full border-b bg-zinc-950/40 backdrop-blur px-4 py-2 text-sm flex items-center gap-4"
      data-testid="status-bar"
    >
      {/* Tek canlı bölge - ekran okuyucular için */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic
        className="sr-only"
      >
        {getLiveMessage()}
      </div>

      {/* Görsel durum göstergeleri */}
      <div className="flex items-center gap-2">
        <StatusDot status={api} label={t('service.api')} />
        <span>{t('service.api')}</span>
        {data && (
          <span className="text-zinc-400">
            ({t('general.error_budget')} {fmtPct(data.errorBudget)})
          </span>
        )}
      </div>
      
      <div
        className="flex items-center gap-2"
        data-testid="ws-badge"
        data-variant={ws === 'up' ? 'success' : ws === 'down' ? 'error' : 'unknown'}
      >
        <StatusDot 
          status={isDevMode ? 'unknown' : ws} 
          label={t('service.ws')} 
        />
        <span>{t('service.ws')}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <StatusDot status={executor} label={t('service.executor')} />
        <span>{t('service.executor')}</span>
      </div>
      
      <div className="ml-auto">
        <Link
          className="underline hover:no-underline text-zinc-400 hover:text-zinc-200"
          href={process.env.NEXT_PUBLIC_GUARD_VALIDATE_URL || "#"}
          target="_blank"
        >
          {t('general.protection_validate')}
        </Link>
      </div>
    </div>
  );
}
