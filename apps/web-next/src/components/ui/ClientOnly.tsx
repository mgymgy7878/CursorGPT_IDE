/**
 * ClientOnly - Render children only on client-side (after mount)
 *
 * SSR mismatch'i önlemek için kullanılır. İlk render'da null/skeleton döner,
 * mount sonrası children render edilir.
 *
 * @example
 * <ClientOnly fallback={<Skeleton />}>
 *   <ComponentThatUsesWindow />
 * </ClientOnly>
 */
"use client";

import { useMounted } from "@/hooks/useMounted";
import type { ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useMounted();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

