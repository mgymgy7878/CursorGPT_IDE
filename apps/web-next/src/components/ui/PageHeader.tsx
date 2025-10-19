import OpsQuickHelp from "./OpsQuickHelp";
import SystemHealthDot from "@/components/dashboard/SystemHealthDot";
import DataModeBadge from "./DataModeBadge";

export function PageHeader({ title, desc }: {title: string; desc?: string}) {
  return (
    <header className="sticky top-0 z-30 px-6 pt-6 pb-3 bg-black/95 backdrop-blur border-b border-neutral-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {desc && <p className="text-neutral-400 mt-1">{desc}</p>}
        </div>
        <div className="flex items-center gap-3">
          <DataModeBadge />
          <SystemHealthDot />
          <OpsQuickHelp />
        </div>
      </div>
    </header>
  );
}
