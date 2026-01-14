"use client";

import { useEffect, useState } from "react";

/**
 * BlankPageGuard - Boş sayfa tespiti ve fallback
 *
 * Eğer sayfa render edildikten 3 saniye sonra hala içerik görünmüyorsa,
 * kullanıcıya bir fallback mesaj gösterir.
 */
export default function BlankPageGuard({ children }: { children: React.ReactNode }) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Sayfa içeriğinin görünür olup olmadığını kontrol et
      const mainContent = document.querySelector('main');
      const hasVisibleContent = mainContent && (
        mainContent.children.length > 0 ||
        mainContent.textContent?.trim().length > 0 ||
        mainContent.querySelector('h1, h2, h3, [role="main"]')
      );

      if (!hasVisibleContent) {
        setShowFallback(true);
        console.warn("[BlankPageGuard] No visible content detected after 3s");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-md text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Sayfa yükleniyor...</h2>
            <p className="text-sm text-neutral-400 mb-4">
              İçerik görünmüyor. Sayfayı yenilemeyi deneyin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Sayfayı Yenile
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors inline-block"
            >
              Dashboard'a Git
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <p className="text-xs text-neutral-500 mb-2">Debug Bilgisi:</p>
            <pre className="text-xs bg-neutral-900 rounded p-2 overflow-auto text-left">
              {`URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'N/A'}
Main Content: ${document.querySelector('main') ? 'Found' : 'Not Found'}
Children Count: ${document.querySelector('main')?.children.length ?? 0}`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
