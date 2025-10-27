import { EventEmitter } from "events";
import type { TradingSignal, SignalQueueItem } from "./types";
import { SignalPriority } from "./types";

export class SignalQueue extends EventEmitter {
  private queue: SignalQueueItem[] = [];
  private maxSize: number;
  private processing: boolean = false;

  constructor(maxSize: number = 100) {
    super();
    this.maxSize = maxSize;
  }

  enqueue(signal: TradingSignal): boolean {
    if (this.queue.length >= this.maxSize) {
      this.emit('queue:full', signal);
      return false;
    }

    const queueItem: SignalQueueItem = {
      signal,
      priority: signal.priority || SignalPriority.NORMAL,
      timestamp: new Date(),
      attempts: 0
    };

    // Priority'ye göre sırala (yüksek öncelik önce)
    this.insertByPriority(queueItem);
    
    this.emit('signal:enqueued', signal);
    console.log(`📥 Signal queued: ${signal.id} (priority: ${queueItem.priority})`);
    
    return true;
  }

  dequeue(): TradingSignal | null {
    if (this.queue.length === 0) {
      return null;
    }

    const item = this.queue.shift()!;
    this.emit('signal:dequeued', item.signal);
    
    return item.signal;
  }

  peek(): TradingSignal | null {
    return this.queue.length > 0 ? this.queue[0]?.signal ?? null : null;
  }

  clear(): void {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.emit('queue:cleared', clearedCount);
    console.log(`🗑️ Queue cleared: ${clearedCount} signals removed`);
  }

  getSize(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }

  getQueueStatus(): {
    size: number;
    maxSize: number;
    isEmpty: boolean;
    isFull: boolean;
    priorities: Record<string, number>;
  } {
    const priorities: Record<string, number> = {};
    
    for (const item of this.queue) {
      const priorityKey = SignalPriority[item.priority];
      priorities[priorityKey] = (priorities[priorityKey] || 0) + 1;
    }

    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      isEmpty: this.isEmpty(),
      isFull: this.isFull(),
      priorities
    };
  }

  removeSignal(signalId: string): boolean {
    const index = this.queue.findIndex(item => item.signal.id === signalId);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      if (removed) {
        this.emit('signal:removed', removed.signal);
        console.log(`🗑️ Signal removed from queue: ${signalId}`);
      }
      return true;
    }
    return false;
  }

  updatePriority(signalId: string, newPriority: SignalPriority): boolean {
    const index = this.queue.findIndex(item => item.signal.id === signalId);
    if (index !== -1) {
      const item = this.queue[index];
      if (item) {
        const oldPriority = item.priority;
        item.priority = newPriority;
        
        // Yeniden sırala
        this.queue.splice(index, 1);
        this.insertByPriority(item);
        
        this.emit('signal:priority_updated', item.signal, oldPriority, newPriority);
        console.log(`🔄 Signal priority updated: ${signalId} ${oldPriority} → ${newPriority}`);
      }
      return true;
    }
    return false;
  }

  getSignalsByPriority(priority: SignalPriority): TradingSignal[] {
    return this.queue
      .filter(item => item.priority === priority)
      .map(item => item.signal);
  }

  getSignalsBySymbol(symbol: string): TradingSignal[] {
    return this.queue
      .filter(item => item.signal.symbol === symbol)
      .map(item => item.signal);
  }

  private insertByPriority(item: SignalQueueItem): void {
    // Priority'ye göre binary search ile doğru pozisyonu bul
    let left = 0;
    let right = this.queue.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midItem = this.queue[mid];
      if (midItem && midItem.priority < item.priority) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    this.queue.splice(left, 0, item);
  }

  // Queue monitoring methods
  getQueueStats(): {
    totalSignals: number;
    averageAge: number;
    oldestSignal: TradingSignal | null;
    newestSignal: TradingSignal | null;
    priorityDistribution: Record<string, number>;
  } {
    if (this.queue.length === 0) {
      return {
        totalSignals: 0,
        averageAge: 0,
        oldestSignal: null,
        newestSignal: null,
        priorityDistribution: {}
      };
    }

    const now = Date.now();
    let totalAge = 0;
    let oldest = this.queue[0];
    let newest = this.queue[0];
    const priorityDistribution: Record<string, number> = {};

    for (const item of this.queue) {
      const age = now - item.timestamp.getTime();
      totalAge += age;

      if (oldest && item.timestamp < oldest.timestamp) {
        oldest = item;
      }
      if (newest && item.timestamp > newest.timestamp) {
        newest = item;
      }

      const priorityKey = SignalPriority[item.priority];
      priorityDistribution[priorityKey] = (priorityDistribution[priorityKey] || 0) + 1;
    }

    return {
      totalSignals: this.queue.length,
      averageAge: totalAge / this.queue.length,
      oldestSignal: oldest?.signal || null,
      newestSignal: newest?.signal || null,
      priorityDistribution
    };
  }

  // Configuration
  setMaxSize(maxSize: number): void {
    this.maxSize = Math.max(1, maxSize);
    this.emit('config:max_size_updated', this.maxSize);
  }

  getMaxSize(): number {
    return this.maxSize;
  }
} 