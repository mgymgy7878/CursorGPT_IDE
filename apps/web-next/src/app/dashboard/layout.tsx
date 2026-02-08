import AppShell from "@/components/layout/AppShell";

/**
 * Fold-first: Ekstra başlık/yükleniyor satırı yok; içerik viewport'a kilitle.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </AppShell>
  );
}


