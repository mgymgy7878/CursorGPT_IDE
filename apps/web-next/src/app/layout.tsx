import './globals.css'
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Script from 'next/script';
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Toaster from "@/components/toast/Toaster";
import ErrorSink from "@/components/core/ErrorSink";
import CommandPalette from "@/components/ui/CommandPalette";
import FloatingActions from "@/components/layout/FloatingActions";
import ChunkGuard from "@/components/ChunkGuard";
import ClientCrashOverlay from "@/components/core/ClientCrashOverlay";
import MarketProvider from "@/providers/MarketProvider";
import AppFrame from "@/components/layout/AppFrame";
import { RightRailProvider } from "@/components/layout/RightRailContext";
import NavigationProgress from "@/components/layout/NavigationProgress";
import "@/styles/theme.css";

export const metadata = {
  title: 'Spark Trading',
  description: 'Trading platform UI',
}

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const headersList = headers();
  const serverHost = headersList.get('host') ?? '';
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const serverOrigin = serverHost ? `${proto}://${serverHost}` : '—';

  return (
    <html lang="tr" className="h-full">
      <body className="h-full bg-surface text-neutral-100 overflow-hidden">
        {/* BOOT PROBE: SSR geldi mi görünür; görünmezse route/middleware/CSS sorunu. Hydration fail'de bu satır yine görünür. Development'ta göster; production'da NEXT_PUBLIC_BOOT_PROBE=1 ile açılabilir. */}
        {process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BOOT_PROBE === '1' ? (
          <div
            id="boot-probe"
            data-boot="layout-ssr-ok"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 999999,
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              background: '#166534',
              color: '#fff',
              borderBottomRightRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ pointerEvents: 'none' }}>BOOT:layout SSR OK</span>
            <span style={{ pointerEvents: 'none', opacity: 0.9 }}>Host: {serverHost}</span>
            <span style={{ pointerEvents: 'none', opacity: 0.9 }}>| origin: </span>
            <span id="boot-origin" style={{ pointerEvents: 'none' }} suppressHydrationWarning>
              {serverOrigin}
            </span>
            <Script id="boot-origin-fill" strategy="afterInteractive">
              {`(function(){var el=document.getElementById('boot-origin');if(el)el.textContent=window.location.origin;})();`}
            </Script>
            <a
              href="/api/dev/clear-site-data?redirect=/dashboard"
              style={{
                color: '#fff',
                textDecoration: 'underline',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              title="Cache + storage + SW temizle, dashboard'a yönlendir (A-sınıfı için)"
            >
              Reset UI Cache
            </a>
          </div>
        ) : null}
        <noscript>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999998,
              background: '#1c1917',
              color: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              fontSize: 14,
            }}
          >
            JS yüklenmedi. Lütfen JavaScript etkinleştirin veya sayfayı yenileyin.
          </div>
        </noscript>
        <ThemeProvider>
          <MarketProvider>
            <RightRailProvider>
              <NavigationProgress />
              <AppFrame>
                {children}
              </AppFrame>
            </RightRailProvider>
            <ChunkGuard />
            <ClientCrashOverlay />
            <Toaster />
            <ErrorSink />
            <CommandPalette />
            <FloatingActions />
          </MarketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
