"use client";
import { useState, useEffect } from "react";

interface DiffReport {
  timestamp: number;
  testRunId: string;
  paperOrders: any[];
  testnetOrders: any[];
  comparison: {
    orderCount: {
      paper: number;
      testnet: number;
      diff: number;
    };
    totalValue: {
      paper: number;
      testnet: number;
      diff: number;
      diffPercent: number;
    };
    executionTime: {
      paper: number;
      testnet: number;
      diff: number;
    };
    fillRatio: {
      paper: number;
      testnet: number;
      diff: number;
    };
    slippage: {
      paper: number;
      testnet: number;
      diff: number;
    };
  };
  summary: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    averageExecutionTime: number;
    totalSlippage: number;
    totalFees: number;
  };
}

export default function DiffAnalyzer() {
  const [reports, setReports] = useState<DiffReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DiffReport | null>(null);

  async function loadReports() {
    try {
      setLoading(true);
      // TODO: Implement report listing endpoint
      // const r = await fetch("/api/private/diff-reports");
      // const data = await r.json();
      // if (r.ok) {
      //   setReports(data.data || []);
      // }
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(testRunId: string) {
    try {
      const r = await fetch(`/api/private/diff-report/${testRunId}`);
      const data = await r.json();
      if (r.ok) {
        setSelectedReport(data.data);
      } else {
        alert(`Failed to load report: ${data.error}`);
      }
    } catch (e) {
      alert(`Report load error: ${e}`);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function formatNumber(num: number, decimals = 2): string {
    return Number(num).toFixed(decimals);
  }

  function formatTime(ms: number): string {
    return `${formatNumber(ms)}ms`;
  }

  function formatPercent(num: number): string {
    return `${formatNumber(num * 100)}%`;
  }

  return (
    <div className="p-4 rounded-xl border bg-purple-50 border-purple-200">
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold text-purple-800">Paper ↔ Testnet Diff Analyzer</div>
        <button
          onClick={loadReports}
          disabled={loading}
          className={`px-3 py-1 text-sm rounded ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {selectedReport ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Test Run: {selectedReport.testRunId}</h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to List
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700">Total Orders</div>
              <div className="text-2xl font-bold text-blue-600">{selectedReport.summary.totalOrders}</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercent(selectedReport.summary.successfulOrders / selectedReport.summary.totalOrders)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700">Avg Execution</div>
              <div className="text-2xl font-bold text-purple-600">{formatTime(selectedReport.summary.averageExecutionTime)}</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700">Total Fees</div>
              <div className="text-2xl font-bold text-red-600">{formatNumber(selectedReport.summary.totalFees)}</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h4 className="font-medium">Performance Comparison</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Metric</th>
                    <th className="px-4 py-2 text-right">Paper</th>
                    <th className="px-4 py-2 text-right">Testnet</th>
                    <th className="px-4 py-2 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium">Order Count</td>
                    <td className="px-4 py-2 text-right">{selectedReport.comparison.orderCount.paper}</td>
                    <td className="px-4 py-2 text-right">{selectedReport.comparison.orderCount.testnet}</td>
                    <td className={`px-4 py-2 text-right ${
                      selectedReport.comparison.orderCount.diff > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.comparison.orderCount.diff > 0 ? '+' : ''}{selectedReport.comparison.orderCount.diff}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Total Value</td>
                    <td className="px-4 py-2 text-right">{formatNumber(selectedReport.comparison.totalValue.paper)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(selectedReport.comparison.totalValue.testnet)}</td>
                    <td className={`px-4 py-2 text-right ${
                      selectedReport.comparison.totalValue.diff > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.comparison.totalValue.diff > 0 ? '+' : ''}{formatNumber(selectedReport.comparison.totalValue.diff)}
                      <span className="text-xs ml-1">({formatNumber(selectedReport.comparison.totalValue.diffPercent)}%)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Execution Time</td>
                    <td className="px-4 py-2 text-right">{formatTime(selectedReport.comparison.executionTime.paper)}</td>
                    <td className="px-4 py-2 text-right">{formatTime(selectedReport.comparison.executionTime.testnet)}</td>
                    <td className={`px-4 py-2 text-right ${
                      selectedReport.comparison.executionTime.diff < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.comparison.executionTime.diff > 0 ? '+' : ''}{formatTime(selectedReport.comparison.executionTime.diff)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Fill Ratio</td>
                    <td className="px-4 py-2 text-right">{formatPercent(selectedReport.comparison.fillRatio.paper)}</td>
                    <td className="px-4 py-2 text-right">{formatPercent(selectedReport.comparison.fillRatio.testnet)}</td>
                    <td className={`px-4 py-2 text-right ${
                      selectedReport.comparison.fillRatio.diff > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.comparison.fillRatio.diff > 0 ? '+' : ''}{formatPercent(selectedReport.comparison.fillRatio.diff)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Slippage</td>
                    <td className="px-4 py-2 text-right">{formatPercent(selectedReport.comparison.slippage.paper)}</td>
                    <td className="px-4 py-2 text-right">{formatPercent(selectedReport.comparison.slippage.testnet)}</td>
                    <td className={`px-4 py-2 text-right ${
                      selectedReport.comparison.slippage.diff < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedReport.comparison.slippage.diff > 0 ? '+' : ''}{formatPercent(selectedReport.comparison.slippage.diff)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h4 className="font-medium">Paper Orders ({selectedReport.paperOrders.length})</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Symbol</th>
                      <th className="px-2 py-1 text-left">Side</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.paperOrders.map((order, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{order.symbol}</td>
                        <td className="px-2 py-1">
                          <span className={`px-1 py-0.5 text-xs rounded ${
                            order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="px-2 py-1">{order.status}</td>
                        <td className="px-2 py-1 text-right">{order.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h4 className="font-medium">Testnet Orders ({selectedReport.testnetOrders.length})</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Symbol</th>
                      <th className="px-2 py-1 text-left">Side</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.testnetOrders.map((order, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{order.symbol}</td>
                        <td className="px-2 py-1">
                          <span className={`px-1 py-0.5 text-xs rounded ${
                            order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="px-2 py-1">{order.status}</td>
                        <td className="px-2 py-1 text-right">{order.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Reports Available</div>
          <div className="text-sm">Run a test to generate comparison reports</div>
        </div>
      )}
    </div>
  );
} 