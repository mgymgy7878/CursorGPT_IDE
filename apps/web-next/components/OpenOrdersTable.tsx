"use client";
import { useEffect, useState } from "react";

export default function OpenOrdersTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/public/orders/open", { cache: 'no-store' });
      const data = await r.json();
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
      setRows(rows);
    } catch (e) {
      console.error('Open orders load error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-4">
      <div className="font-semibold mb-2">Open Orders</div>
      {loading ? (
        <div className="text-center p-4 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left">ID</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Symbol</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Side</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Type</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Qty</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Price</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-3 opacity-70 border border-gray-200">
                    No open orders
                  </td>
                </tr>
              ) : (
                rows.map((o, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">{o.orderId}</td>
                    <td className="border border-gray-200 px-3 py-2 font-medium">{o.symbol}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        o.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {o.side}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2">{o.type}</td>
                    <td className="border border-gray-200 px-3 py-2">{o.origQty}</td>
                    <td className="border border-gray-200 px-3 py-2">{o.price}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        o.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 