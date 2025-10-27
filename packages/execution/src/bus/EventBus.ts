import { EventEmitter } from "events";
import type { ExecutionEvent, TradeEvent } from "../types";

export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitExecution(event: ExecutionEvent): void {
    event.timestamp = event.timestamp || new Date();
    this.emit(`execution:${event.executionId}`, event);
    this.emit('execution:*', event);
  }

  emitTrade(event: TradeEvent): void {
    this.emit(`trades:${event.executionId}`, event);
    this.emit('trades:*', event);
  }

  onExecution(executionId: string, callback: (event: ExecutionEvent) => void): void {
    this.on(`execution:${executionId}`, callback);
  }

  onTrades(executionId: string, callback: (event: TradeEvent) => void): void {
    this.on(`trades:${executionId}`, callback);
  }

  onAllExecutions(callback: (event: ExecutionEvent) => void): void {
    this.on('execution:*', callback);
  }

  onAllTrades(callback: (event: TradeEvent) => void): void {
    this.on('trades:*', callback);
  }

  offExecution(executionId: string, callback: (event: ExecutionEvent) => void): void {
    this.off(`execution:${executionId}`, callback);
  }

  offTrades(executionId: string, callback: (event: TradeEvent) => void): void {
    this.off(`trades:${executionId}`, callback);
  }

  // SSE helper for web clients
  createSSEStream(executionId: string): ReadableStream {
    const encoder = new TextEncoder();
    
    return new ReadableStream({
      start: (controller) => {
        const sendEvent = (event: ExecutionEvent | TradeEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        this.onExecution(executionId, sendEvent);
        this.onTrades(executionId, sendEvent);

        // Send heartbeat every 20 seconds
        const heartbeat = setInterval(() => {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeatData));
        }, 20000);

        // Cleanup on close
        return () => {
          clearInterval(heartbeat);
          this.offExecution(executionId, sendEvent);
          this.offTrades(executionId, sendEvent);
        };
      }
    });
  }
} 