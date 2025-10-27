"use client";
import React from "react";
export default function HealthBadge({ status = "GREEN" }: { status?: "GREEN" | "YELLOW" | "RED" }) {
  const color = status === "GREEN" ? "text-emerald-400" : status === "YELLOW" ? "text-amber-400" : "text-rose-400";
  return <span className={`inline-flex items-center gap-2 text-xs ${color}`}><span className="w-2 h-2 rounded-full bg-current" />{status}</span>;
} 