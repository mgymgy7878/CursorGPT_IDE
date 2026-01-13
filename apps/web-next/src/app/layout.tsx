import './globals.css'
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Toaster from "@/components/toast/Toaster";
import ErrorSink from "@/components/core/ErrorSink";
import CommandPalette from "@/components/ui/CommandPalette";
import FloatingActions from "@/components/layout/FloatingActions";
import ChunkGuard from "@/components/ChunkGuard";
import MarketProvider from "@/providers/MarketProvider";
import AppFrame from "@/components/layout/AppFrame";
import { RightRailProvider } from "@/components/layout/RightRailContext";
import "@/styles/theme.css";

export const metadata = {
  title: 'Spark Trading',
  description: 'Trading platform UI',
}

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full bg-surface text-neutral-100 overflow-hidden">
        <ThemeProvider>
          <MarketProvider>
            <RightRailProvider>
              <AppFrame>
                {children}
              </AppFrame>
            </RightRailProvider>
            <ChunkGuard />
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
