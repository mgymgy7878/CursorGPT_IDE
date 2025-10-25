/**
 * Toxiproxy Chaos Engineering Setup
 * Simulates network failures, latency, and packet loss
 */

import Toxiproxy from 'toxiproxy-node-client';

const toxiproxy = new Toxiproxy('http://localhost:8474');

export interface ProxyConfig {
  name: string;
  listen: string;
  upstream: string;
}

export interface ToxicConfig {
  name: string;
  type: 'latency' | 'bandwidth' | 'slow_close' | 'timeout' | 'slicer' | 'limit_data';
  attributes: Record<string, any>;
  toxicity: number; // 0-1, probability of toxic applying
}

/**
 * Setup standard proxies for testing
 */
export async function setupProxies(): Promise<void> {
  const proxies: ProxyConfig[] = [
    {
      name: 'postgres',
      listen: '127.0.0.1:26432',
      upstream: '127.0.0.1:5432',
    },
    {
      name: 'redis',
      listen: '127.0.0.1:26379',
      upstream: '127.0.0.1:6379',
    },
    {
      name: 'binance_api',
      listen: '127.0.0.1:24430',
      upstream: 'api.binance.com:443',
    },
    {
      name: 'btcturk_api',
      listen: '127.0.0.1:24431',
      upstream: 'api.btcturk.com:443',
    },
  ];

  for (const proxy of proxies) {
    try {
      await toxiproxy.createProxy(proxy);
      console.log(`✅ Created proxy: ${proxy.name}`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`⚠️  Proxy already exists: ${proxy.name}`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Add latency toxic to simulate slow network
 */
export async function addLatency(
  proxyName: string,
  latencyMs: number,
  jitterMs: number = 0,
  toxicity: number = 1.0
): Promise<void> {
  const proxy = await toxiproxy.get(proxyName);
  await proxy.addToxic({
    name: `${proxyName}_latency`,
    type: 'latency',
    attributes: {
      latency: latencyMs,
      jitter: jitterMs,
    },
    toxicity,
  });
  console.log(`✅ Added latency (${latencyMs}ms ±${jitterMs}ms) to ${proxyName}`);
}

/**
 * Add bandwidth limit toxic
 */
export async function addBandwidthLimit(
  proxyName: string,
  rateBytesPerSec: number,
  toxicity: number = 1.0
): Promise<void> {
  const proxy = await toxiproxy.get(proxyName);
  await proxy.addToxic({
    name: `${proxyName}_bandwidth`,
    type: 'bandwidth',
    attributes: {
      rate: rateBytesPerSec,
    },
    toxicity,
  });
  console.log(`✅ Added bandwidth limit (${rateBytesPerSec} B/s) to ${proxyName}`);
}

/**
 * Add timeout toxic (closes connection after timeout)
 */
export async function addTimeout(
  proxyName: string,
  timeoutMs: number,
  toxicity: number = 1.0
): Promise<void> {
  const proxy = await toxiproxy.get(proxyName);
  await proxy.addToxic({
    name: `${proxyName}_timeout`,
    type: 'timeout',
    attributes: {
      timeout: timeoutMs,
    },
    toxicity,
  });
  console.log(`✅ Added timeout (${timeoutMs}ms) to ${proxyName}`);
}

/**
 * Add slicer toxic (slices TCP data into smaller packets)
 */
export async function addSlicer(
  proxyName: string,
  averageSizeBytes: number,
  delayMs: number,
  toxicity: number = 1.0
): Promise<void> {
  const proxy = await toxiproxy.get(proxyName);
  await proxy.addToxic({
    name: `${proxyName}_slicer`,
    type: 'slicer',
    attributes: {
      average_size: averageSizeBytes,
      size_variation: Math.floor(averageSizeBytes * 0.5),
      delay: delayMs,
    },
    toxicity,
  });
  console.log(`✅ Added slicer (${averageSizeBytes}B, ${delayMs}ms) to ${proxyName}`);
}

/**
 * Remove all toxics from a proxy
 */
export async function clearToxics(proxyName: string): Promise<void> {
  const proxy = await toxiproxy.get(proxyName);
  const toxics = await proxy.toxics();
  
  for (const toxic of toxics) {
    await toxic.remove();
  }
  
  console.log(`✅ Cleared all toxics from ${proxyName}`);
}

/**
 * Chaos scenarios for testing
 */
export const chaosScenarios = {
  /**
   * Scenario 1: Slow database
   */
  async slowDatabase(): Promise<void> {
    await addLatency('postgres', 500, 200, 0.8);
    console.log('🌪️  CHAOS: Slow database (500ms ±200ms latency)');
  },

  /**
   * Scenario 2: Network partition (complete timeout)
   */
  async networkPartition(proxyName: string): Promise<void> {
    await addTimeout(proxyName, 0, 1.0);
    console.log(`🌪️  CHAOS: Network partition on ${proxyName}`);
  },

  /**
   * Scenario 3: Exchange API rate limiting (429 responses)
   */
  async exchangeRateLimit(): Promise<void> {
    await addLatency('binance_api', 1000, 0, 0.5);
    await addTimeout('binance_api', 5000, 0.3);
    console.log('🌪️  CHAOS: Exchange rate limiting simulation');
  },

  /**
   * Scenario 4: Packet loss simulation
   */
  async packetLoss(proxyName: string): Promise<void> {
    await addSlicer(proxyName, 100, 50, 0.3);
    console.log(`🌪️  CHAOS: Packet loss on ${proxyName}`);
  },

  /**
   * Scenario 5: Slow and unreliable network
   */
  async slowAndUnreliableNetwork(): Promise<void> {
    await addLatency('binance_api', 2000, 1000, 0.9);
    await addTimeout('binance_api', 10000, 0.1);
    console.log('🌪️  CHAOS: Slow and unreliable network');
  },

  /**
   * Scenario 6: Database connection pool exhaustion
   */
  async databaseConnectionExhaustion(): Promise<void> {
    await addBandwidthLimit('postgres', 1024, 1.0); // 1 KB/s
    await addLatency('postgres', 5000, 2000, 0.5);
    console.log('🌪️  CHAOS: Database connection pool exhaustion');
  },
};

/**
 * Cleanup all proxies
 */
export async function cleanup(): Promise<void> {
  const proxies = await toxiproxy.getAll();
  
  for (const proxy of proxies) {
    await clearToxics(proxy.name);
    await proxy.remove();
  }
  
  console.log('✅ Cleaned up all proxies');
}
