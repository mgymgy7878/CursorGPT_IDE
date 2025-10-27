# BIST Reader Contract (v1)

## Fields
- `ts` (epoch ms): Timestamp in milliseconds
- `seq` (int): Sequence number, strictly increasing
- `symbol` (string): Stock symbol (e.g., "BIST:AA")
- `price` (number): Current price
- `volume` (number): Trading volume

## SLOs
- `ingest_lag_p95 <= 2000 ms`: 95th percentile ingest lag
- `seq_gap = 0`: No sequence gaps allowed

## Format
JSONL (JSON Lines) format with one JSON object per line 