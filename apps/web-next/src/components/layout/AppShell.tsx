"use client";
import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
