import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { metrics, register } from './metrics.js';
import { wsClient } from './ws-client.js';

const fastify = Fastify({
  logger: true
});

// CORS ayarları
await fastify.register(cors, {
  origin: true
});

// Metrics endpoint
fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return await register.metrics();
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// WebSocket server oluştur
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    // Mesaj sayısını artır
    metrics.wsMessagesTotal.inc();
    
    // Echo back
    ws.send(data);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// WebSocket client başlat
wsClient.start();

// Test için manuel metrik oluştur
setInterval(() => {
  metrics.wsMessagesTotal.inc({ exchange: 'binance', channel: 'aggTrade' });
  metrics.wsGapMs.observe({ exchange: 'binance', channel: 'aggTrade' }, Math.random() * 100);
  metrics.ingestLatencyMs.observe({ exchange: 'binance', channel: 'aggTrade' }, Math.random() * 50);
  metrics.wsConnState.set({ exchange: 'binance', channel: 'aggTrade' }, 1);
}, 1000);

// Server başlat
const start = async () => {
  try {
    await fastify.listen({ port: 4001, host: '0.0.0.0' });
    console.log('Streams service listening on port 4001');
    
    server.listen(4002, () => {
      console.log('WebSocket server listening on port 4002');
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();