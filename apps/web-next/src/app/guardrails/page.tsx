"use client";
export const dynamic = "force-dynamic";

import { useTranslation } from "@/i18n/useTranslation";
import EmptyState from "@/components/ui/EmptyState";

export default function GuardrailsPage() {
  const t = useTranslation("common");

  return (
    <div className="px-6 py-4 min-h-screen bg-neutral-950">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{t("guardrails")}</h1>
        <p className="text-sm text-zinc-500">
          Risk yönetimi, koruma kuralları ve limit kontrolleri
        </p>
      </div>

      <EmptyState
        icon="🛡️"
        title={t("noData")}
        description="Risk koruma kuralları ve limitler yakında burada görünecek"
      />
    </div>
  );
}
