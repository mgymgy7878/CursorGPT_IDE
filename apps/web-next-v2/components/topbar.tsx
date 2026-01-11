'use client';

import { Badge } from '@/components/ui/badge';

export function Topbar() {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 p-3 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      <Badge variant="secondary" className="min-h-[24px] px-3">
        P95 58 ms
      </Badge>
      <Badge variant="secondary" className="min-h-[24px] px-3">
        Anlık gecikme &lt;1sn
      </Badge>
      <Badge variant="secondary" className="min-h-[24px] px-3">
        EB 100%
      </Badge>
    </div>
  );
}

