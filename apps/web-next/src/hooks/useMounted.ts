/**
 * useMounted hook - Client-side mount detection
 *
 * SSR sırasında false, client-side mount sonrası true döner.
 * Bu sayede localStorage, window, matchMedia gibi client-only API'leri
 * güvenli bir şekilde kullanabilirsiniz.
 *
 * @example
 * const mounted = useMounted();
 * const theme = mounted ? localStorage.getItem('theme') : 'auto';
 */
import { useEffect, useState } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

