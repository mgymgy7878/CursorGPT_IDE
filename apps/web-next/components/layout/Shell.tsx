"use client";
import React from "react";

export default function Shell({ left, top, right, children }: {
  left?: React.ReactNode; top?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 py-3">{top}</div>
      </div>

      {/* 3-column grid */}
      <div className="mx-auto max-w-[1400px] grid grid-cols-12 gap-4 px-4 pt-4">
        {/* Left rail */}
        <aside className="col-span-2 hidden lg:block">
          <div className="sticky top-[64px] space-y-2">{left}</div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 lg:col-span-7">
          <div className="rounded-2xl border border-neutral-800 p-4">{children}</div>
        </main>

        {/* Right rail */}
        <aside className="col-span-3 hidden xl:block">
          <div className="sticky top-[64px] h-[calc(100vh-80px)] overflow-auto rounded-2xl border border-neutral-800 p-3">
            {right}
          </div>
        </aside>
      </div>
    </div>
  );
}
