# @spark/exchange-btcturk

BTCTurk Spot Exchange Integration

## Environment Variables

```bash
# Optional - for authenticated endpoints
BTCTURK_API_KEY=your_api_key
BTCTURK_API_SECRET=your_api_secret

# Optional - override default URLs
BTCTURK_BASE_URL=https://api.btcturk.com/api/v2
BTCTURK_WS_URL=wss://ws-feed.btcturk.com
```

## Usage

```typescript
import { BTCTurkClient } from '@spark/exchange-btcturk';

const client = new BTCTurkClient({
  apiKey: process.env.BTCTURK_API_KEY,
  apiSecret: process.env.BTCTURK_API_SECRET
});

// Start WebSocket connection
await client.start();

// Listen for events
client.onEvent((event) => {
  console.log('BTCTurk event:', event);
});

// Stop connection
await client.stop();
```

## Features

- REST API client for ticker, orderbook, trades
- WebSocket client for real-time data
- Automatic reconnection with exponential backoff
- Rate limiting support
- TypeScript support
