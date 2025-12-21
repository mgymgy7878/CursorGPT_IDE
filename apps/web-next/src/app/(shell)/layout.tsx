"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ErrorSink from "@/components/core/ErrorSink";
import FloatingActions from "@/components/layout/FloatingActions";
import ChunkGuard from "@/components/ChunkGuard";
import AppFrame from "@/components/layout/AppFrame";
import { RightRailProvider } from "@/components/layout/RightRailContext";
import "@/styles/theme.css";

/**
 * Shell Layout: AppFrame, RightRail, Theme gibi orta ağırlık component'ler
 * Bu layout (shell) group'undaki tüm route'lar için geçerlidir
 * MarketProvider burada DEĞİL - sadece market route'larında
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <RightRailProvider>
        <AppFrame>{children}</AppFrame>
      </RightRailProvider>
      <ChunkGuard />
      <ErrorSink />
      <FloatingActions />
    </ThemeProvider>
  );
}

