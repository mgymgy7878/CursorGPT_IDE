import ChatPanel from "@/components/studio/ChatPanel";
import CodeEditor from "@/components/studio/CodeEditor";
import BacktestRunner from "@/components/studio/BacktestRunner";
import OptimizerPanel from "@/components/studio/OptimizerPanel";
import SaveDeploy from "@/components/studio/SaveDeploy";
import GuardrailsPanel from "@/components/studio/GuardrailsPanel";

export default function StrategyStudio() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Strategy Studio</h1>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChatPanel />
        <CodeEditor />
      </section>
      <BacktestRunner />
      <OptimizerPanel />
      <GuardrailsPanel />
      <SaveDeploy />
    </main>
  );
}


