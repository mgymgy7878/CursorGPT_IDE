# Secrets Handling (hash8 verification)
- Never print secrets. We verify presence via sha256 hash8.
- Populate .env.local from .env.local.todo, keep it uncommitted.
- Readiness rules: binance.present ⇒ READY-ORDERFLOW; else if bist.present ⇒ READY-BIST; else BLOCKED. 