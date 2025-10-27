# @spark/symbols

Symbol Normalization for Trading Pairs

## Usage

```typescript
import { normalize, isSupportedPair, mapSymbol } from '@spark/symbols';

// Normalize symbols
const normalized = normalize('btcturk', 'BTCUSDT'); // 'BTC/USDT'
const supported = isSupportedPair('BTC/USDT'); // true

// Map symbol with metadata
const mapping = mapSymbol('btcturk', 'BTCUSDT');
// { source: 'btcturk', raw: 'BTCUSDT', normalized: 'BTC/USDT', supported: true }
```

## Supported Patterns

- `BTCUSDT` → `BTC/USDT`
- `BTCTRY` → `BTC/TRY`
- `ETHUSD` → `ETH/USD`
- `ADAEUR` → `ADA/EUR`

## Supported Quote Currencies

- USDT
- TRY
- USD
- EUR
