// WebSocket Live Stream Plugin
// v1.9-p2 - Real-time data stream

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  app.register(require('@fastify/websocket'));

  app.get('/ws/live', { websocket: true }, (connection, req) => {
    const subscriptions = new Set<string>();

    connection.socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === 'subscribe') {
          data.topics?.forEach((t: string) => subscriptions.add(t));
          app.log.info({ topics: Array.from(subscriptions) }, 'ws_subscribe');
        } else if (data.type === 'unsubscribe') {
          data.topics?.forEach((t: string) => subscriptions.delete(t));
        } else if (data.type === 'pong') {
          // Heartbeat response received
        }
      } catch (err) {
        app.log.warn({ error: err }, 'ws_invalid_message');
      }
    });

    // Heartbeat: ping every 30s
    const heartbeat = setInterval(() => {
      if (connection.socket.readyState === 1) {
        connection.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    // Demo broadcast: metrics every 10s
    const broadcast = setInterval(() => {
      if (subscriptions.has('metrics')) {
        connection.socket.send(
          JSON.stringify({
            type: 'metrics',
            data: {
              p95_ms: Math.random() * 10,
              error_rate: Math.random() * 2,
              psi: 1 + Math.random() * 0.5,
              match_rate: 95 + Math.random() * 5,
              ts: Date.now(),
            },
          })
        );
      }

      // Demo: orders updates (occasionally)
      if (subscriptions.has('orders') && Math.random() > 0.7) {
        connection.socket.send(
          JSON.stringify({
            type: 'orders',
            data: {
              action: 'insert',
              order: {
                id: `ord-${Date.now()}`,
                symbol: 'BTCUSDT',
                side: Math.random() > 0.5 ? 'BUY' : 'SELL',
                qty: 0.1,
                px: 62000 + Math.random() * 1000,
                ts: Date.now(),
              },
            },
          })
        );
      }

      // Demo: alerts (rarely)
      if (subscriptions.has('alerts') && Math.random() > 0.9) {
        connection.socket.send(
          JSON.stringify({
            type: 'alerts',
            data: {
              id: `alert-${Date.now()}`,
              level: Math.random() > 0.5 ? 'warning' : 'critical',
              source: 'optimizer',
              message: 'Demo alert from WS stream',
              ts: Date.now(),
            },
          })
        );
      }
    }, 10000);

    connection.socket.on('close', () => {
      clearInterval(heartbeat);
      clearInterval(broadcast);
      app.log.info({ client: req.ip }, 'ws_disconnected');
    });

    app.log.info({ client: req.ip }, 'ws_connected');
  });

  app.log.info('[WebSocket Live] Stream registered: /ws/live');
});

