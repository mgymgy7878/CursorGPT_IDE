# Gate C Smoke Test - Manual Test Guide

## Prerequisites

1. Start dev server:
   ```powershell
   pnpm --filter web-next dev -- --port 3003
   ```

2. **Option A: Normal browser**
   - Open browser: http://localhost:3003
   - Open DevTools (F12):
     - Network tab
     - Console tab
     - Filter: `event-stream` in Network tab

3. **Option B: NetLog capture (recommended for objective evidence)**
   ```powershell
   .\tools\gate-c-netlog.ps1
   ```
   - Browser will start with NetLog capture enabled
   - NetLog file: `artifacts/netlog/gateC_netlog_[timestamp].json`
   - After tests, analyze at: https://netlog-viewer.appspot.com/

4. **Enable Debug Badge (optional but helpful)**
   - Add `?debugLive=1` to URL: http://localhost:3003?debugLive=1
   - OR set in browser console: `localStorage.setItem('debugLive', 'true')`
   - Refresh page
   - Debug badge will show: activeStreams, state, requestId, events, tokens, duration

---

## Test 1: Dual Panel Single Stream

### Steps:
1. Open CopilotDock (right panel)
2. Open DevTools Network tab, filter: `event-stream`
3. Send a message in CopilotDock (e.g., "Portföy durumunu göster")
4. **While streaming**, open/close StatusBar panel (or any status widget)
5. Observe Network tab

### Expected:
- ✅ Only **ONE** `api/copilot/chat` SSE connection
- ✅ Opening/closing StatusBar does NOT create new connection
- ✅ Stream continues uninterrupted

### Evidence Collection:
- **Network tab screenshot** showing single connection (event-stream filter)
- **NetLog file** (if using NetLog script): Upload to https://netlog-viewer.appspot.com/ and verify single SSE connection
- **Debug badge** (if enabled): Verify "Streams: 1" in bottom-right corner
- Note requestId from Network request or Debug badge
- Record timestamps
- Fill `evidence/gateC_dual_panel_single_stream.txt` with metadata header

---

## Test 2: Abort Determinism

### Steps:
1. Open CopilotDock
2. Send a message to start streaming
3. **While streaming**, click Cancel/Stop button
4. Observe:
   - UI state (should be 'idle', not 'error')
   - Console (no error event for AbortError)
   - Network tab (stream closes gracefully)

### Expected:
- ✅ UI state: `idle` (not `error`)
- ✅ Console: No "error event" for AbortError
- ✅ Network: Stream closes (FIN/closed)
- ✅ AbortError caught silently (Gate B compatibility)

### Evidence Collection:
- **Console log snapshot** showing no error event for AbortError
- **Network tab screenshot** showing closed connection (FIN/closed)
- **Debug badge** (if enabled): Verify state changes to "idle" (not "error")
- Note requestId
- Fill `evidence/gateC_abort_idle_no_error_event.txt` with metadata header

---

## Test 3: Limits Enforce

### Steps:
1. Open CopilotDock
2. **Option A (maxDuration):**
   - Temporarily modify `maxDuration` in `useLiveSession.ts` to 5000ms (5s)
   - Send a message that takes longer than 5s
   - Wait for limit to be exceeded

   **Option B (maxChars/maxTokens):**
   - Send a very long message or request that generates many tokens
   - Wait for limit to be exceeded

3. Observe:
   - Stream closes with limit error
   - Error code: `TOKEN_LIMIT_EXCEEDED`, `CHAR_LIMIT_EXCEEDED`, or `DURATION_LIMIT_EXCEEDED`
   - Evidence log written

### Expected:
- ✅ Stream closes when limit exceeded
- ✅ Error code logged correctly
- ✅ Evidence written to localStorage/console
- ✅ UI shows appropriate error message

### Evidence Collection:
- **Console log** showing limit exceeded with error code
- **Debug badge** (if enabled): Verify state shows error with appropriate error code
- Note error code: `TOKEN_LIMIT_EXCEEDED`, `CHAR_LIMIT_EXCEEDED`, or `DURATION_LIMIT_EXCEEDED`
- Note which limit was triggered and counters
- Fill `evidence/gateC_limits_enforced.txt` with metadata header

---

## Evidence Files Checklist

After completing tests, verify these files are filled:

- [ ] `evidence/gateC_dual_panel_single_stream.txt` (with metadata header + PASS/FAIL)
- [ ] `evidence/gateC_abort_idle_no_error_event.txt` (with metadata header + PASS/FAIL)
- [ ] `evidence/gateC_limits_enforced.txt` (with metadata header + PASS/FAIL)
- [ ] `evidence/gateC_server_log_tail.txt` (optional, from terminal)
- [ ] `evidence/gateB_nginx_location_extract.txt` (already filled)
- [ ] NetLog file: `artifacts/netlog/gateC_netlog_[timestamp].json` (if using NetLog script)

---

## Quick Verification Commands

```powershell
# Check evidence files exist
Get-ChildItem evidence/gateC_*.txt

# View evidence collection from localStorage (in browser console):
# localStorage.getItem('evidence_collection')
```

---

## Notes

- All evidence files are templates - fill them manually during tests
- Console logs include evidence data - copy to evidence files
- Network tab screenshots are valuable evidence
- Server logs (terminal output) can be copied to `gateC_server_log_tail.txt`

