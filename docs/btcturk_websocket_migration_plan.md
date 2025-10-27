# BTCTurk WebSocket Migration Plan

## Overview

Migrate BTCTurk data collection from 2s polling to WebSocket for real-time ticker and orderbook data.

## Current State

- Polling interval: 2 seconds
- Data sources: ticker, orderbook
- UI components: Health Pill, Spread Card

## Target State

- WebSocket connection for real-time data
- Connection state management: OPEN/CLOSED/DEGRADED
- Fallback to polling on connection issues

## Implementation Plan

### Phase 1: Connection State Management

```typescript
// UI Store Extensions
interface ConnectionState {
  status: "OPEN" | "CLOSED" | "DEGRADED";
  lastUpdate: Date;
  reconnectAttempts: number;
  latency: number;
}
```

### Phase 2: WebSocket Client

- BTCTurk WebSocket API integration
- Automatic reconnection logic
- Connection health monitoring
- Latency measurement

### Phase 3: Data Flow

- Real-time ticker updates
- Orderbook depth updates
- Connection state indicators in UI
- Graceful degradation to polling

### Phase 4: Performance Targets

- Connection latency: <100ms
- Data update frequency: <500ms
- Reconnection time: <5s
- Fallback activation: <2s

## Integration with Canary

- Daily latency evidence collection
- P95 targets: placed→ACK <1000ms, event→DB <300ms
- PASS/FAIL badge system based on performance

## Timeline

- **48 hours**: Mini-sprint completion
- **Week 1**: WebSocket client implementation
- **Week 2**: UI integration and testing
- **Week 3**: Production deployment and monitoring
