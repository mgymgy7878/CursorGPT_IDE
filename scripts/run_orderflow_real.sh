#!/usr/bin/env bash
set -euo pipefail
export BINANCE_BASE_URL="${BINANCE_BASE_URL:-https://testnet.binance.vision}"
export CANARY_SYMBOL="${CANARY_SYMBOL:-BTCUSDT}"
export CANARY_QTY="${CANARY_QTY:-0.00015}"
export CANARY_N="${CANARY_N:-3}"
export MAX_NOTIONAL_USDT="${MAX_NOTIONAL_USDT:-20}"
bash -lc 'echo "Run the previously provided orderflow-guardrails-real command."' 