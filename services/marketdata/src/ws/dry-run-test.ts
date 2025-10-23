import { BTCTurkWSClient } from './btcturk.js';

// DRY-RUN test for BTCTurk WebSocket connection
async function dryRunTest() {
  console.log('🚀 Starting BTCTurk WS DRY-RUN test...');
  
  const client = new BTCTurkWSClient();
  let messageCount = 0;
  let reconnectCount = 0;
  
  // Track connection events
  const originalConnect = client.connect.bind(client);
  client.connect = function() {
    console.log('📡 Attempting connection to wss://ws-feed-pro.btcturk.com/');
    return originalConnect();
  };
  
  // Subscribe to ticker channel
  client.subscribe('ticker', (data) => {
    messageCount++;
    console.log(`📊 Ticker message #${messageCount}:`, JSON.stringify(data).substring(0, 100) + '...');
    
    if (messageCount >= 100) {
      console.log('✅ Received 100 messages, stopping test');
      client.disconnect();
      process.exit(0);
    }
  });
  
  // Subscribe to trades channel  
  client.subscribe('trade', (data) => {
    messageCount++;
    console.log(`💱 Trade message #${messageCount}:`, JSON.stringify(data).substring(0, 100) + '...');
  });
  
  // Track reconnections
  const originalScheduleReconnect = (client as any).scheduleReconnect.bind(client);
  (client as any).scheduleReconnect = function() {
    reconnectCount++;
    console.log(`🔄 Reconnection attempt #${reconnectCount}`);
    return originalScheduleReconnect();
  };
  
  // Start connection
  client.connect();
  
  // Log connection status every 5 seconds
  const statusInterval = setInterval(() => {
    const connected = client.isConnected();
    console.log(`📊 Status: ${connected ? 'CONNECTED' : 'DISCONNECTED'} | Messages: ${messageCount} | Reconnects: ${reconnectCount}`);
  }, 5000);
  
  // Stop after 60 seconds max
  setTimeout(() => {
    console.log('⏰ Test timeout reached');
    client.disconnect();
    clearInterval(statusInterval);
    process.exit(0);
  }, 60000);
}

// Run the test
dryRunTest().catch(console.error);
