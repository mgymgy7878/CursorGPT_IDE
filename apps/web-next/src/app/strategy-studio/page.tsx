"use client";

import { useState } from "react";
import ChatPanel from "@/components/studio/ChatPanel";
import CodeEditor from "@/components/studio/CodeEditor";
import BacktestRunner from "@/components/studio/BacktestRunner";
import OptimizerPanel from "@/components/studio/OptimizerPanel";
import SaveDeploy from "@/components/studio/SaveDeploy";
import GuardrailsPanel from "@/components/studio/GuardrailsPanel";
import StrategyWizard from "@/features/studio/StrategyWizard";

export default function StrategyStudio() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCode, setWizardCode] = useState<string | null>(null);

  return (
    <main className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Strategy Studio</h1>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500"
          aria-label="Strategy generator wizard aç"
        >
          + Generate Strategy
        </button>
      </div>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChatPanel />
        <CodeEditor initialCode={wizardCode} />
      </section>
      <BacktestRunner />
      <OptimizerPanel />
      <GuardrailsPanel />
      <SaveDeploy />
      {showWizard && (
        <StrategyWizard
          onComplete={(code) => {
            setWizardCode(code);
            setShowWizard(false);
          }}
          onClose={() => setShowWizard(false)}
        />
      )}
    </main>
  );
}
