import { StreamEvent } from "./types";
import { 
  streamsMessagesTotal, 
  streamsSeqGapTotal, 
  streamsDupTotal, 
  streamsOutOfOrderTotal,
  streamsIngestLagSeconds,
  streamsLastSeq,
  streamsEventToDbMs
} from "./metrics";

export class StreamNormalizer {
  private lastSeqs = new Map<string, number>();
  private seenEvents = new Set<string>();

  normalizeEvent(event: StreamEvent): StreamEvent | null {
    const key = `${event.src}_${event.symbol}_${event.seq}`;
    
    // Check for duplicates
    if (this.seenEvents.has(key)) {
      streamsDupTotal.inc({ src: event.src, symbol: event.symbol });
      return null;
    }
    this.seenEvents.add(key);

    // Update metrics
    streamsMessagesTotal.inc({ src: event.src, symbol: event.symbol, type: event.type });
    
    // Check sequence gaps
    const lastSeq = this.lastSeqs.get(`${event.src}_${event.symbol}`) || 0;
    if (event.seq > lastSeq + 1) {
      streamsSeqGapTotal.inc({ src: event.src, symbol: event.symbol });
    }
    
    if (event.seq < lastSeq) {
      streamsOutOfOrderTotal.inc({ src: event.src, symbol: event.symbol });
    }
    
    this.lastSeqs.set(`${event.src}_${event.symbol}`, event.seq);
    streamsLastSeq.set({ src: event.src, symbol: event.symbol }, event.seq);

    // Calculate ingest lag
    const ingestLag = (event.tsIngest - event.tsSource) / 1000;
    streamsIngestLagSeconds.set({ src: event.src, symbol: event.symbol }, ingestLag);

    return event;
  }

  async persistEvent(event: StreamEvent): Promise<void> {
    const startTime = Date.now();
    
    // Simulate database persistence
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    
    const persistTime = Date.now() - startTime;
    streamsEventToDbMs.observe({ src: event.src, symbol: event.symbol }, persistTime);
  }

  getMetrics() {
    const metrics: Record<string, any> = {};
    
    for (const [key, seq] of this.lastSeqs) {
      const [src, symbol] = key.split('_');
      metrics[`last_seq_${src}_${symbol}`] = seq;
    }
    
    return metrics;
  }
} 