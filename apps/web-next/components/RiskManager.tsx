"use client";
import { useState, useEffect } from "react";

interface RiskRule {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  value: number;
  enabled: boolean;
  description: string;
}

interface RiskSummary {
  totalExposure: number;
  dailyPnL: number;
  activePositions: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function RiskManager() {
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'MAX_ORDER_SIZE',
    value: 100,
    description: ''
  });

  async function loadRiskData() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/risk/rules");
      const data = await r.json();
      if (r.ok) {
        setRules(data.data.rules || []);
        setSummary(data.data.summary || null);
      }
    } catch (e) {
      console.error('Risk data error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function addRule() {
    try {
      const rule = {
        id: `rule-${Date.now()}`,
        ...newRule,
        enabled: true
      };

      const r = await fetch("/api/private/risk/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule)
      });

      if (r.ok) {
        alert("Risk rule added successfully!");
        setNewRule({ name: '', type: 'MAX_ORDER_SIZE', value: 100, description: '' });
        loadRiskData();
      } else {
        const data = await r.json();
        alert(`Failed to add rule: ${data.error}`);
      }
    } catch (e) {
      alert(`Error adding rule: ${e}`);
    }
  }

  useEffect(() => {
    loadRiskData();
  }, []);

  function getRiskLevelColor(level: string) {
    switch (level) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  return (
    <div className="p-4 rounded-xl border bg-red-50 border-red-200">
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold text-red-800">Risk Management</div>
        <button
          onClick={loadRiskData}
          disabled={loading}
          className={`px-3 py-1 text-sm rounded ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Total Exposure</div>
            <div className="text-2xl font-bold text-blue-600">${summary.totalExposure.toFixed(2)}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Daily PnL</div>
            <div className={`text-2xl font-bold ${
              summary.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${summary.dailyPnL.toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Active Positions</div>
            <div className="text-2xl font-bold text-purple-600">{summary.activePositions}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Risk Level</div>
            <div className={`text-2xl font-bold ${getRiskLevelColor(summary.riskLevel)}`}>
              {summary.riskLevel}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Rules */}
        <div className="bg-white rounded border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h4 className="font-medium">Risk Rules</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t">
                    <td className="px-3 py-2">{rule.name}</td>
                    <td className="px-3 py-2 text-xs">{rule.type}</td>
                    <td className="px-3 py-2 text-right">${rule.value}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Rule */}
        <div className="bg-white rounded border p-4">
          <h4 className="font-medium mb-4">Add New Risk Rule</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Max BTC Position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="MAX_ORDER_SIZE">Max Order Size</option>
                <option value="MAX_POSITION_SIZE">Max Position Size</option>
                <option value="PER_SYMBOL_EXPOSURE">Per Symbol Exposure</option>
                <option value="GLOBAL_DAILY_LOSS">Global Daily Loss</option>
                <option value="MIN_NOTIONAL">Min Notional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
              <input
                type="number"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Rule description"
              />
            </div>
            <button
              onClick={addRule}
              disabled={!newRule.name || !newRule.description}
              className={`w-full px-4 py-2 rounded ${
                !newRule.name || !newRule.description
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Add Risk Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 