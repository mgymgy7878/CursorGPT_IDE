import { BTCTurkWSClient } from './btcturk.js';

// Live BTCTurk WebSocket test with public channels
async function liveTest() {
  console.log('🚀 Starting BTCTurk WS LIVE test...');
  
  const client = new BTCTurkWSClient();
  let messageCount = 0;
  let reconnectCount = 0;
  const startTime = Date.now();
  
  // Track reconnections
  const originalScheduleReconnect = (client as any).scheduleReconnect.bind(client);
  (client as any).scheduleReconnect = function() {
    reconnectCount++;
    console.log(`🔄 Reconnection attempt #${reconnectCount}`);
    return originalScheduleReconnect();
  };
  
  // Subscribe to ticker channel (public, no auth required)
  client.subscribe('ticker', (data) => {
    messageCount++;
    console.log(`📊 Ticker message #${messageCount}:`, JSON.stringify(data).substring(0, 100) + '...');
    
    if (messageCount >= 500) {
      console.log('✅ Received 500 messages, stopping test');
      const duration = Date.now() - startTime;
      console.log(`📈 Performance: ${messageCount} messages in ${duration}ms (${Math.round(messageCount / (duration / 1000))} msg/s)`);
      client.disconnect();
      process.exit(0);
    }
  });
  
  // Subscribe to orderbook channel (public, no auth required)
  client.subscribe('orderbook', (data) => {
    messageCount++;
    console.log(`📖 Orderbook message #${messageCount}:`, JSON.stringify(data).substring(0, 100) + '...');
  });
  
  // Start connection
  client.connect();
  
  // Log connection status every 10 seconds
  const statusInterval = setInterval(() => {
    const connected = client.isConnected();
    const duration = Date.now() - startTime;
    console.log(`📊 Status: ${connected ? 'CONNECTED' : 'DISCONNECTED'} | Messages: ${messageCount} | Reconnects: ${reconnectCount} | Duration: ${Math.round(duration / 1000)}s`);
  }, 10000);
  
  // Stop after 5 minutes max
  setTimeout(() => {
    console.log('⏰ Test timeout reached');
    const duration = Date.now() - startTime;
    console.log(`📈 Final Stats: ${messageCount} messages, ${reconnectCount} reconnects in ${Math.round(duration / 1000)}s`);
    client.disconnect();
    clearInterval(statusInterval);
    process.exit(0);
  }, 300000);
}

// Run the test
liveTest().catch(console.error);
