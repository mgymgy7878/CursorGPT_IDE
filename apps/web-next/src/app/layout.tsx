import './globals.css'
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Toaster from "@/components/toast/Toaster";
import ErrorSink from "@/components/core/ErrorSink";
import CommandPalette from "@/components/ui/CommandPalette";
import FloatingActions from "@/components/layout/FloatingActions";
import ChunkGuard from "@/components/ChunkGuard";
import MarketProvider from "@/providers/MarketProvider";
import StatusBar from "@/components/status-bar";
import LeftNav from "@/components/left-nav";
import CopilotDock from "@/components/copilot/CopilotDock";
import WsToast from "@/components/toast/WsToast";
import DevModeBanner from "@/components/DevModeBanner";
import "@/styles/theme.css";

export const metadata = {
  title: 'Spark Trading',
  description: 'Trading platform UI',
}

export const dynamic = 'force-dynamic';

import { DensityProvider } from "@/providers/DensityProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const env = process.env.NEXT_PUBLIC_ENV ?? 'dev'
  return (
    <html lang="tr" className="h-full">
      <DensityProvider>
        <ThemeProvider>
          <MarketProvider>
            <div className="h-full flex flex-col" data-env={env}>
              <StatusBar />
              <DevModeBanner />
              <div className="flex flex-1 overflow-hidden">
                <LeftNav />
                <main className="flex-1 overflow-auto pb-24 md:pb-28">
                  {children}
                </main>
              </div>
            </div>
            <ChunkGuard />
            <Toaster />
            <WsToast />
            <ErrorSink />
            <CommandPalette />
            <FloatingActions />
            <CopilotDock />
          </MarketProvider>
        </ThemeProvider>
      </DensityProvider>
    </html>
  )
}
