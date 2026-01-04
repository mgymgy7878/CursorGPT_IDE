# UI: Spark Mode Toggle (Prod/Testnet/Paper)

**Dev:** web-next port 3003  
**Evidence:** Çıktılar `evidence/` klasörüne yazılır

## Summary

This PR adds a Spark Mode selector in Settings (Prod/Testnet/Paper) with StatusBar badge display. Mode selection is stored in localStorage (client-only override) and is SSR-safe.

## Key Changes

### Settings Page
- **Spark Mode Selector**: New section in App settings tab
- **Visual Indicators**: Color-coded buttons (🔴 Prod, 🟡 Testnet, 🔵 Paper)
- **Warning Banner**: Red warning when Prod mode is active
- **localStorage Override**: Client-only override (SSR-safe, env vars take precedence)

### Status Bar
- **Mode Badge**: Displays current Spark Mode (PROD/TESTNET/PAPER)
- **Color Coding**: Prod (red), Testnet (amber/degraded), Paper (green)
- **Click to Change**: Badge links to Settings page
- **Real-time Updates**: Listens for localStorage changes and custom events

## Technical Details

### SSR Safety
- `useSparkMode` hook checks `window` before accessing localStorage
- Falls back to `getSparkMode()` (env-based) during SSR
- Client-side override stored in `spark-mode-override` localStorage key

### Event System
- `storage` event for cross-tab updates
- Custom `spark-mode-changed` event for same-window updates
- StatusBar and Settings stay in sync

## Testing

### Mode Selection
1. Navigate to Settings > App tab
2. Select different Spark Modes (Prod/Testnet/Paper)
3. Verify StatusBar badge updates immediately
4. Refresh page - mode should persist (localStorage)

### SSR Safety
1. Build production bundle
2. Verify no hydration errors
3. Mode should default to env-based value on first load

### Cross-tab Sync
1. Open Settings in two tabs
2. Change mode in one tab
3. Verify StatusBar updates in both tabs

## Breaking Changes
None. This is a UI-only addition.

## Files Changed
- `apps/web-next/src/app/(shell)/settings/page.tsx` - Spark Mode selector
- `apps/web-next/src/components/status-bar.tsx` - Mode badge display

## Reviewer Checklist
- [ ] Mode selector works in Settings
- [ ] StatusBar badge displays correct mode
- [ ] Mode persists after page refresh
- [ ] No SSR/hydration errors
- [ ] Cross-tab sync works
- [ ] Prod mode warning displays correctly

## Notes

- **Trade Buttons**: This PR does NOT modify trade/order execution buttons. Those remain gated by `confirm_required` and prod gates.
- **Env Priority**: Build-time env vars (`SPARK_MODE`, `NEXT_PUBLIC_SPARK_MODE`) take precedence over localStorage override.
- **Future**: Order execution UI will respect this mode setting in a separate PR.

