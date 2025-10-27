"use client";
import { ReactNode } from "react";
import TopStatusBar from "./TopStatusBar";
import SidebarNav from "./SidebarNav";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar Navigation */}
      <SidebarNav />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Status Bar */}
        <TopStatusBar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 