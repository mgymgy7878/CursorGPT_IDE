import express from "express";
import { register } from "prom-client";
import { BinanceConnector } from "./connectors/binance";
import { StreamNormalizer } from "./normalizer";
import { ChaosInjector } from "./chaos";
import { streamsHeartbeat } from "./metrics";

const app = express();
app.use(express.json());

// Initialize components
const binanceConnector = new BinanceConnector();
const normalizer = new StreamNormalizer();
const chaosInjector = new ChaosInjector();

// Health endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectors: {
      binance: binanceConnector.isConnected()
    },
    chaos: chaosInjector.getActiveChaos()
  };
  res.json(health);
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Chaos injection endpoint
app.post('/chaos', (req, res) => {
  const { mode, duration = 30000, intensity = 0.1 } = req.body;
  
  if (!['lag', 'gap', 'drop'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid chaos mode' });
  }
  
  chaosInjector.injectChaos({ mode, duration, intensity });
  res.json({ 
    message: `Chaos injected: ${mode}`,
    duration,
    intensity
  });
});

// Start streams
app.post('/start', async (req, res) => {
  try {
    await binanceConnector.connect();
    
    // Start heartbeat updates
    setInterval(() => {
      streamsHeartbeat.set({ src: 'binance' }, binanceConnector.getLastHeartbeat());
    }, 5000);
    
    res.json({ 
      message: 'Streams started',
      connectors: ['binance']
    });
  } catch (error) {
    console.error('Error starting streams:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Stop streams
app.post('/stop', async (req, res) => {
  try {
    await binanceConnector.disconnect();
    res.json({ message: 'Streams stopped' });
  } catch (error) {
    console.error('Error stopping streams:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Get current metrics
app.get('/metrics/summary', (req, res) => {
  const summary = {
    timestamp: new Date().toISOString(),
    connectors: {
      binance: {
        connected: binanceConnector.isConnected(),
        lastHeartbeat: binanceConnector.getLastHeartbeat()
      }
    },
    chaos: chaosInjector.getActiveChaos(),
    normalizer: normalizer.getMetrics()
  };
  res.json(summary);
});

const PORT = process.env.PORT || 4601;

app.listen(PORT, () => {
  console.log(`Streams service listening on port ${PORT}`);
}); 