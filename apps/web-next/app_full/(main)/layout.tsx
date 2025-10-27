export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Eğer gerçek AppProviders bileşenin varsa onu import et.
// Yoksa geçici no-op bırak (çökmez).
function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}