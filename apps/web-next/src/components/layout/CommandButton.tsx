"use client";
import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export function CommandButton() {
  const t = useTranslation("common");

  return (
    <button
      className="rounded-lg px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium transition-colors"
      aria-label={t("commands")}
    >
      ⌘K {t("commands")}
    </button>
  );
}
