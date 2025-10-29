"use client";

import { useStrategyLabStore } from "@/stores/strategyLabStore";

export default function DeployTab() {
  const { deploymentConfig, setDeploymentConfig, bestParams } = useStrategyLabStore();

  const handleDeploy = (isDryRun: boolean) => {
    // TODO: Call deployment API
    console.log("Deploying strategy:", { isDryRun, config: deploymentConfig });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Dağıt</h2>
        <p className="text-sm text-zinc-500">
          Stratejinizi canlı ortama dağıtın. Önce canary (test) modunda deneyin.
        </p>
      </div>

      {/* Strategy name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Strateji Adı
        </label>
        <input
          id="name"
          type="text"
          value={deploymentConfig.name}
          onChange={(e) => setDeploymentConfig({ name: e.target.value })}
          placeholder="Örn: MA Crossover v1"
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Risk limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Pozisyon ($)
          </label>
          <input
            type="number"
            value={deploymentConfig.riskLimits.maxPosition || 10000}
            onChange={(e) =>
              setDeploymentConfig({
                riskLimits: {
                  ...deploymentConfig.riskLimits,
                  maxPosition: Number(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Lot Boyutu</label>
          <input
            type="number"
            step="0.01"
            value={deploymentConfig.lotSize}
            onChange={(e) =>
              setDeploymentConfig({ lotSize: Number(e.target.value) })
            }
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
          />
        </div>
      </div>

      {/* Canary toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="canary"
          checked={deploymentConfig.canary}
          onChange={(e) => setDeploymentConfig({ canary: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="canary" className="text-sm">
          Canary modu (24 saat test sonrası canlıya al)
        </label>
      </div>

      {/* Deploy buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleDeploy(true)}
          disabled={!deploymentConfig.name.trim()}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
        >
          Canary (Dry-run)
        </button>
        <button
          onClick={() => handleDeploy(false)}
          disabled={!deploymentConfig.name.trim() || deploymentConfig.canary}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
        >
          Canlıya Al
        </button>
      </div>

      <div className="p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-lg">
        <div className="text-sm text-yellow-500">⚠️ Uyarı</div>
        <div className="text-xs text-zinc-400 mt-1">
          Canlıya almadan önce mutlaka canary modunda test edin.
        </div>
      </div>
    </div>
  );
}

