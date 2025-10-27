"use client";
import { useEffect, useState } from "react";
import { Clock, Filter, RefreshCw } from "lucide-react";

interface Order {
  id: string;
  ts: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  px: number;
  status: "FILLED" | "PENDING" | "CANCELLED";
}

export default function OrdersStream() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [maxOrders] = useState(200);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/public/events/orders");
        
        eventSource.onopen = () => {
          setIsConnected(true);
          console.log("Orders SSE connected");
        };

        eventSource.onmessage = (event) => {
          if (event.type === "order") {
            try {
              const order: Order = JSON.parse(event.data);
              setOrders(prev => {
                const newOrders = [order, ...prev.slice(0, maxOrders - 1)];
                return newOrders;
              });
            } catch (error) {
              console.error("Failed to parse order:", error);
            }
          }
        };

        eventSource.onerror = (error) => {
          console.error("Orders SSE error:", error);
          setIsConnected(false);
          eventSource?.close();
          
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (error) {
        console.error("Failed to connect to Orders SSE:", error);
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [maxOrders]);

  const filteredOrders = orders.filter(order => 
    filter === "" || 
    order.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    order.status.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FILLED": return "text-green-400";
      case "PENDING": return "text-amber-400";
      case "CANCELLED": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getSideColor = (side: string) => {
    return side === "BUY" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Orders Stream</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-400 font-mono">msgs: {orders.length}</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
          <span className="text-sm text-neutral-400">
            {isConnected ? "Live" : "Disconnected"}
          </span>
          <RefreshCw className={`w-4 h-4 ${isConnected ? "text-green-400" : "text-red-400"}`} />
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter by symbol or status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left py-2 font-medium">Time</th>
              <th className="text-left py-2 font-medium">Symbol</th>
              <th className="text-left py-2 font-medium">Side</th>
              <th className="text-right py-2 font-medium">Quantity</th>
              <th className="text-right py-2 font-medium">Price</th>
              <th className="text-left py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                <td className="py-2 text-neutral-400">
                  {new Date(order.ts).toLocaleTimeString()}
                </td>
                <td className="py-2 font-mono">{order.symbol}</td>
                <td className={`py-2 font-medium ${getSideColor(order.side)}`}>
                  {order.side}
                </td>
                <td className="py-2 text-right font-mono">{order.qty}</td>
                <td className="py-2 text-right font-mono">${order.px.toLocaleString()}</td>
                <td className={`py-2 font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-neutral-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No orders to display</p>
        </div>
      )}

      <div className="mt-4 text-xs text-neutral-500">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  );
} 