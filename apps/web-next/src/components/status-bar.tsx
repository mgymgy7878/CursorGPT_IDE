"use client";

import Link from "next/link";
import { StatusDot } from "./status-dot";
import { useUnifiedStatus } from "@/hooks/useUnifiedStatus";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useTranslation } from "@/i18n/useTranslation";

export default function StatusBar() {
  const { api, ws, executor } = useUnifiedStatus();
  const { data } = useHeartbeat();
  const t = useTranslation("common");

  return (
    <div
      className="w-full border-b bg-zinc-950/40 backdrop-blur px-4 py-2 text-sm flex items-center gap-4"
      role="status"
      aria-live="polite"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-2">
        <StatusDot status={api} label="API" />
        <span>{t("api")}</span>
        {data && (
          <span className="text-zinc-400">
            (EB {(data.errorBudget * 100).toFixed(0)}%)
          </span>
        )}
      </div>
      <div
        className="flex items-center gap-2"
        data-testid="ws-badge"
        data-variant={ws === 'up' ? 'success' : ws === 'down' ? 'error' : 'unknown'}
      >
        <StatusDot status={ws} label="WS" />
        <span>{t("ws")}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status={executor} label="Executor" />
        <span>Executor</span>
      </div>
      <div className="ml-auto">
        <Link
          className="underline hover:no-underline text-zinc-400 hover:text-zinc-200"
          href={process.env.NEXT_PUBLIC_GUARD_VALIDATE_URL || "#"}
          target="_blank"
        >
          {t("guardValidate")}
        </Link>
      </div>
    </div>
  );
}
