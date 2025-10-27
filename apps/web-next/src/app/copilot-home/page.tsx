'use client';

import { Card, Title, Text, Badge, Grid } from '@tremor/react';
import { Activity, AlertCircle, DollarSign, TrendingUp, Bot, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SystemHealth {
  executor: boolean;
  portfolio: boolean;
  futures: boolean;
}

interface FuturesPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  positionSide: string;
}

interface FuturesOrder {
  symbol: string;
  orderId: number;
  side: string;
  type: string;
  price: string;
  origQty: string;
  status: string;
}

export default function CopilotHomePage() {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [positions, setPositions] = useState<FuturesPosition[]>([]);
  const [orders, setOrders] = useState<FuturesOrder[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch real data
  const fetchData = async () => {
    try {
      const [posResp, ordResp, alertResp, metResp] = await Promise.all([
        fetch('/api/futures/positions').then(r => r.json()).catch(() => []),
        fetch('/api/futures/openOrders').then(r => r.json()).catch(() => []),
        fetch('/api/alerts').then(r => r.json()).catch(() => ({ data: { alerts: [] } })),
        fetch('/api/metrics').then(r => r.text()).catch(() => ''),
      ]);

      setPositions(Array.isArray(posResp) ? posResp : []);
      setOrders(Array.isArray(ordResp) ? ordResp : []);
      setAlerts(alertResp.data?.alerts || []);
      setMetrics(metResp);
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Call copilot API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput, history: chatHistory }),
      });

      const data = await response.json();

      // Add AI response (action JSON)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.action || data,
        raw: data
      }]);
    } catch (err) {
      console.error('Copilot error:', err);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: { error: 'API call failed', message: String(err) }
      }]);
    } finally {
      setLoading(false);
      setChatInput('');
    }
  };

  const executeAction = async (action: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      // Show result in chat history
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: result,
      }]);

      // Refresh data after action
      await fetchData();
    } catch (err) {
      console.error('Action execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title>Spark Copilot</Title>
          <Text className="mt-1">Canlı veri + AI eylem yürütme</Text>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border hover:bg-gray-50 transition"
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Bot className="w-10 h-10 text-blue-500" />
        </div>
      </div>

      {/* Live Data Cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
        <Card>
          <Text className="font-semibold">Açık Pozisyonlar</Text>
          <Text className="text-3xl font-bold mt-2">
            {positions.length}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {positions.filter(p => parseFloat(p.positionAmt) > 0).length} LONG, {' '}
            {positions.filter(p => parseFloat(p.positionAmt) < 0).length} SHORT
          </Text>
        </Card>

        <Card>
          <Text className="font-semibold">Açık Emirler</Text>
          <Text className="text-3xl font-bold mt-2">
            {orders.length}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {orders.filter(o => o.side === 'BUY').length} BUY, {' '}
            {orders.filter(o => o.side === 'SELL').length} SELL
          </Text>
        </Card>

        <Card>
          <Text className="font-semibold">Aktif Alert'ler</Text>
          <Text className="text-3xl font-bold mt-2">
            {alerts.length}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {alerts.filter(a => a.state === 'firing').length} firing
          </Text>
        </Card>

        <Card>
          <Text className="font-semibold">Unrealized PnL</Text>
          <Text className={`text-3xl font-bold mt-2 ${
            positions.reduce((sum, p) => sum + parseFloat(p.unRealizedProfit || '0'), 0) >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {positions.reduce((sum, p) => sum + parseFloat(p.unRealizedProfit || '0'), 0).toFixed(2)}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">USDT</Text>
        </Card>
      </Grid>

      {/* Open Positions Detail */}
      {positions.length > 0 && (
        <Card>
          <Title>Açık Pozisyonlar</Title>
          <div className="mt-4 space-y-2">
            {positions.filter(p => parseFloat(p.positionAmt) !== 0).map((pos, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <Text className="font-semibold">{pos.symbol}</Text>
                  <Text className="text-sm text-gray-500">
                    {pos.positionSide} • {parseFloat(pos.positionAmt).toFixed(4)}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    Entry: ${parseFloat(pos.entryPrice).toFixed(2)} | Mark: ${parseFloat(pos.markPrice).toFixed(2)}
                  </Text>
                </div>
                <div className="text-right">
                  <Text
                    className={`font-semibold text-lg ${
                      parseFloat(pos.unRealizedProfit) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {parseFloat(pos.unRealizedProfit) >= 0 ? '+' : ''}
                    {parseFloat(pos.unRealizedProfit).toFixed(2)} USDT
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open Orders Detail */}
      {orders.length > 0 && (
        <Card>
          <Title>Açık Emirler</Title>
          <div className="mt-4 space-y-2">
            {orders.map((order, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <Text className="font-semibold">{order.symbol}</Text>
                  <Text className="text-sm text-gray-500">
                    {order.side} {order.type} • {order.origQty}
                  </Text>
                </div>
                <div className="text-right">
                  <Badge color={order.status === 'NEW' ? 'blue' : 'gray'}>
                    {order.status}
                  </Badge>
                  <Text className="text-sm mt-1">${parseFloat(order.price).toFixed(2)}</Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chat Interface */}
      <Card>
        <Title>Copilot Chat</Title>
        <div className="mt-4 space-y-4">
          {/* Chat history */}
          <div className="h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
            {chatHistory.length === 0 ? (
              <Text className="text-center text-gray-500">
                Merhaba! Size nasıl yardımcı olabilirim?
              </Text>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-100 ml-12'
                      : 'bg-white mr-12'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <Text>{msg.content}</Text>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(msg.content, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Portföy özeti göster, futures riskim ne?..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleChatSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Gönder
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => executeAction({
                action: '/futures/ws.start',
                params: { symbols: ['BTCUSDT', 'ETHUSDT'] },
                dryRun: true,
                confirm_required: false,
                reason: 'market + userData WS başlat',
              })}
              disabled={loading}
              className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
            >
              WS Başlat (BTC,ETH)
            </button>
            <button
              onClick={() => executeAction({
                action: '/futures/order.place',
                params: {
                  symbol: 'BTCUSDT',
                  side: 'BUY',
                  type: 'MARKET',
                  quantity: 0.001,
                  dryRun: true,
                },
                dryRun: true,
                confirm_required: false,
                reason: 'emir dry-run simülasyon',
              })}
              disabled={loading}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
            >
              Dry-Run BUY 0.001 BTC
            </button>
            <button
              onClick={() => executeAction({
                action: '/canary/run',
                params: {
                  scope: 'futures-testnet',
                  symbol: 'BTCUSDT',
                  side: 'BUY',
                  quantity: 0.001,
                },
                dryRun: true,
                confirm_required: false,
                reason: 'canary simülasyon',
              })}
              disabled={loading}
              className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50"
            >
              Canary Run (Testnet)
            </button>
          </div>

          {/* Metrics Snapshot */}
          {metrics && (
            <div className="mt-4">
              <Text className="text-sm font-semibold mb-2">Metrics Snapshot:</Text>
              <pre className="text-[10px] bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-48 font-mono">
                {metrics.split('\n').filter(l => l.includes('spark_futures_') || l.includes('spark_portfolio_')).slice(0, 30).join('\n')}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* KAP Scanner Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Title>KAP Tarama (Beta)</Title>
            <Text className="text-sm text-gray-500 mt-1">
              Kamuyu Aydınlatma Platformu - Bildirim analizi
            </Text>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch('/api/kap/scan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                const data = await response.json();
                
                setChatHistory(prev => [...prev, {
                  role: 'system',
                  content: {
                    message: `KAP tarama tamamlandı: ${data.count} bildirim`,
                    signals: data.signals?.slice(0, 5),
                  },
                }]);

                alert(`KAP: ${data.count} sinyal bulundu. Chat geçmişinde detaylar.`);
              } catch (err) {
                console.error('KAP scan error:', err);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            KAP Tara
          </button>
        </div>
        <Text className="text-xs text-gray-500">
          Finansal tablolar, özel durum açıklamaları, temettü, geri alım programları ve diğer bildirimleri sınıflandırır.
          Kısa/orta/uzun vade işlem fikirleri üretir.
        </Text>
      </Card>
    </div>
  );
}

