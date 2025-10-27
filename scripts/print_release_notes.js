const fs = require("fs");
const path = require("path");

const notes = `
# Spark v0.3.2 — Private API (Testnet) & Execution Stack

- Private API (HMAC, testnet) + write guard
- OCO/STOP, Cancel-All, Balance snapshot
- Precision/MinNotional clamp, Idempotency, Replace
- Auto-Sync Symbol Discovery, Diff Analyzer
- WS Order/Account, Risk Rules, Real-time PnL
- CI GREEN: typecheck/lint/test/build, Secret Guard

See docs/RELEASE_NOTES_v0.3.2.md for details.
`;

console.log(notes.trim()); 