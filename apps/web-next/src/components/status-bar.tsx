"use client";

import Link from "next/link";
import { StatusDot } from "./status-dot";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useWsHeartbeat } from "@/hooks/useWsHeartbeat";
import { useEngineHealth } from "@/hooks/useEngineHealth";
import { useTranslation } from "@/i18n/useTranslation";

export default function StatusBar() {
  const { data, error, isLoading } = useHeartbeat();
  const apiOk = !error && !!data;
  const wsOk = useWsHeartbeat();
  const { ok: engineOk } = useEngineHealth();
  const t = useTranslation("common");

  return (
    <div
      className="w-full border-b bg-zinc-950/40 backdrop-blur px-4 py-2 text-sm flex items-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <StatusDot ok={apiOk} />
        <span>{t("api")}</span>
        {data && (
          <span className="text-zinc-400">
            (EB {(data.errorBudget * 100).toFixed(0)}%)
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusDot ok={wsOk} />
        <span>{t("ws")}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot ok={engineOk} />
        <span>{t("engine")}</span>
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
