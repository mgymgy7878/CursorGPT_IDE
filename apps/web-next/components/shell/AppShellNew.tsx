"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import dynamic from "next/dynamic";
const CopilotPanel = dynamic(() => import("@/components/copilot/CopilotPanel"), { ssr: false });

export default function AppShellNew({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Üst bar (56px) */}
      <Topbar />
      {/* 2 sütun: 240px sidebar + içerik  */}
      <div className="grid grid-cols-[240px_1fr]">
        <Sidebar />
        {/* Sağ Copilot sabit dock */}
        <div className="relative">
          {/* Ana içerik: ekrana sığsın; genel scroll YOK, sadece bu bölüm scroll edebilir */}
          <main id="app-content" className="h-[calc(100vh-56px)] overflow-auto p-3 md:p-4">
            {children}
          </main>
          <CopilotPanel />
        </div>
      </div>
    </div>
  );
}
