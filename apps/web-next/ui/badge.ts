// apps/web-next/ui/badge.ts
// Minimal badge helper: tone tabanlı class üretimi (tokens ile uyumlu)

import { toneToBadgeClass, UITone } from "./tokens";

export function badgeClass({ tone }: { tone: UITone }) {
  return `inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${toneToBadgeClass[tone]}`;
} 