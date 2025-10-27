# @spark/market-bist

BIST Market Data Reader

## Usage

```typescript
import { BISTReader } from '@spark/market-bist';

const reader = new BISTReader({
  source: 'file',
  filePath: '/tmp/bist-data.json'
});

// Start reading
await reader.start();

// Listen for events
reader.onEvent((event) => {
  console.log('BIST event:', event);
});

// Stop reading
await reader.stop();
```

## Features

- File-based data source
- Real-time event emission
- TypeScript support
- Extensible for other data sources (API, pipe)
