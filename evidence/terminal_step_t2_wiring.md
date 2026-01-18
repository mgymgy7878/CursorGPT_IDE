# Terminal Step T2 — MarketWatch + Selection + OrderBook Wiring

## What changed
- MarketWatch canlı/seed tickers ile doluyor (pair, last, 24h%).
- Sembol seçimi workspace header ve order book’u güncelliyor.
- Seed/Live badge görünür, seed durumunda UI crash yok.

## Evidence Screenshots
### 1) 1920x1080 — BTC seçili
![Terminal BTC](./assets/terminal_step_t2/01_terminal_1920_selected_btc.png)

### 2) 1920x1080 — ETH seçili
![Terminal ETH](./assets/terminal_step_t2/02_terminal_1920_selected_eth.png)

### 3) Seed badge (forced)
![Terminal Seed](./assets/terminal_step_t2/03_terminal_seed_badge.png)

### 4) 1366x768 — right panel kapalı
![Terminal 1366](./assets/terminal_step_t2/04_terminal_1366_right_closed.png)

## Reproduce (Playwright)
- `pnpm -C apps/web-next capture:terminal-step-t2`
- Assertions:
  - `terminal-root` görünür
  - Root no-scroll
  - MarketWatch görünür

## Pass criteria
- 1920x1080: BTC/ETH seçimi UI’ı değiştirir.
- Seed modunda badge görünür.
- 1366x768: right panel kapalı, root scroll yok.
