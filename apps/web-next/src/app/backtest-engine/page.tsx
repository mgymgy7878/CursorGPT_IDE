import dynamic from "next/dynamic";

const JobCreator = dynamic(()=>import("@/components/backtest/JobCreator"),{ ssr:false });
const JobsTable = dynamic(()=>import("@/components/backtest/JobsTable"),{ ssr:false });
const JobsListLite = dynamic(()=>import("@/components/backtest/JobsListLite"),{ ssr:false });
const DatasetManager = dynamic(()=>import("@/components/backtest/DatasetManager"),{ ssr:false });
const QueueSummaryCard = dynamic(()=>import("@/components/backtest/QueueSummaryCard"),{ ssr:false });

export default function BacktestEnginePage(){
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Backtest Engine</h1>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <JobCreator />
        <QueueSummaryCard />
      </section>
      <DatasetManager />
      <JobsTable />
    </main>
  );
}


