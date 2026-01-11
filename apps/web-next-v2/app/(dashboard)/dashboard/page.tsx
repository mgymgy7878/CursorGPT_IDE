import { Topbar } from '@/components/topbar';
import { Sidebar } from '@/components/sidebar';
import { DashboardGrid } from '@/components/dashboard/grid';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-[260px_1fr] min-h-dvh">
      <aside className="border-r border-white/10">
        <Sidebar />
      </aside>
      <main className="flex flex-col">
        <Topbar />
        <DashboardGrid />
      </main>
    </div>
  );
}

