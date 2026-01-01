/**
 * useHydrated - SSR/CSR hydration uyumu için hook
 *
 * İlk render'da false döner (SSR ile aynı), mount sonrası true.
 * Client-only logic'i gate'lemek için kullanılır.
 */

'use client';

import { useState, useEffect } from 'react';

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

