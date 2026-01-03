import "./globals.css";
import type { ReactNode } from "react";
import nextDynamic from "next/dynamic";

// DİKKAT: Fallback mod - compile hang durumunda kullanılır
const MINIMAL = process.env.SPARK_MINIMAL_LAYOUT === "1";

// UX-only components: Client-side, SSR kapalı (root compile'ı hafifletir)
const CommandPalette = nextDynamic(
  () => import("@/components/ui/CommandPalette"),
  { ssr: false }
);
const Toaster = nextDynamic(() => import("@/components/toast/Toaster"), {
  ssr: false,
});

export const metadata = {
  title: "Spark Trading",
  description: "Trading platform UI",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Fallback: Minimal mode (compile hang durumunda)
  if (MINIMAL) {
    return (
      <html lang="tr" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    );
  }

  // Normal: Ince kabuk - sadece UX eklentileri (client-only, dynamic)
  // suppressHydrationWarning: theme/SSR mismatch gürültüsünü azaltır
  // PATCH HARDENING: dvh + single-scroll contract (root seviyesinde)
  return (
    <html lang="tr" suppressHydrationWarning className="h-full">
      <body className="h-dvh min-h-0 overflow-hidden overscroll-none">
        {children}
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}
