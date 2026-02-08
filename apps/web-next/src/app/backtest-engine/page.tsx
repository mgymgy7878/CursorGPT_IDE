"use client";

import { Suspense } from "react";
import JobCreator from "@/components/backtest/JobCreator";
import JobsTable from "@/components/backtest/JobsTable";
import JobsListLite from "@/components/backtest/JobsListLite";
import DatasetManager from "@/components/backtest/DatasetManager";
import QueueSummaryCard from "@/components/backtest/QueueSummaryCard";

export default function BacktestEnginePage(){
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Backtest Engine</h1>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<div className="text-xs text-neutral-500">Yükleniyor…</div>}>
          <JobCreator />
        </Suspense>
        <Suspense fallback={<div className="text-xs text-neutral-500">Yükleniyor…</div>}>
          <QueueSummaryCard />
        </Suspense>
      </section>
      <Suspense fallback={<div className="text-xs text-neutral-500">Yükleniyor…</div>}>
        <DatasetManager />
      </Suspense>
      <Suspense fallback={<div className="text-xs text-neutral-500">Yükleniyor…</div>}>
        <JobsTable />
      </Suspense>
    </main>
  );
}


