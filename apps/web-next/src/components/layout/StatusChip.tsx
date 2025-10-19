"use client";
import React from "react";

interface StatusChipProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warn" | "danger";
}

export function StatusChip({ label, value, tone = "neutral" }: StatusChipProps) {
  const toneMap: Record<string, string> = {
    neutral: "bg-neutral-800 text-neutral-200",
    success: "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-800",
    warn: "bg-amber-900/40 text-amber-300 ring-1 ring-amber-800",
    danger: "bg-red-900/40 text-red-300 ring-1 ring-red-800",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${toneMap[tone]}`}>
      <span className="opacity-70">{label}:</span>
      <strong>{value}</strong>
    </span>
  );
}
