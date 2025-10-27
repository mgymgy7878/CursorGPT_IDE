/**
 * BIST Reader Scheduler
 * Manages scheduled data fetching and processing
 */

import { EventEmitter } from 'events';
import cron from 'node-cron';
import type { BISTConfig, BISTSchedulerConfig, BISTJobResult } from './types.js';
import { BISTFetcher } from './fetcher.js';
import { BISTNormalizer } from './normalize.js';
import { 
  bistReaderSchedulerRunsTotal,
  bistReaderLastRunTimestamp,
  bistReaderNextRunTimestamp,
  bistReaderMarketStatus,
  bistReaderActiveJobs
} from './metrics.js';

export class BISTScheduler extends EventEmitter {
  private config: BISTConfig;
  private schedulerConfig: BISTSchedulerConfig;
  private fetcher: BISTFetcher;
  private normalizer: BISTNormalizer;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor(config: BISTConfig, schedulerConfig: BISTSchedulerConfig) {
    super();
    this.config = config;
    this.schedulerConfig = schedulerConfig;
    this.fetcher = new BISTFetcher(config);
    this.normalizer = new BISTNormalizer();
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('BIST Scheduler already running');
      return;
    }

    this.isRunning = true;
    this.setupTasks();
    this.updateMarketStatus();
    
    console.log('BIST Scheduler started');
    this.emit('started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop all cron tasks
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`Stopped BIST task: ${name}`);
    }
    
    this.tasks.clear();
    this.fetcher.stop();
    
    console.log('BIST Scheduler stopped');
    this.emit('stopped');
  }

  /**
   * Setup cron tasks based on market hours
   */
  private setupTasks(): void {
    // Market hours task (every 1 minute during market hours)
    const marketHoursTask = cron.schedule('* * * * *', () => {
      if (this.isMarketOpen()) {
        this.runJob('market_hours');
      }
    }, { scheduled: false });

    // After hours task (every 5 minutes after market close)
    const afterHoursTask = cron.schedule('*/5 * * * *', () => {
      if (!this.isMarketOpen()) {
        this.runJob('after_hours');
      }
    }, { scheduled: false });

    // Market open task (at market open)
    const marketOpenTask = cron.schedule('0 9 * * 1-5', () => {
      this.runJob('market_open');
    }, { scheduled: false });

    // Market close task (at market close)
    const marketCloseTask = cron.schedule('0 18 * * 1-5', () => {
      this.runJob('market_close');
    }, { scheduled: false });

    // Store tasks
    this.tasks.set('market_hours', marketHoursTask);
    this.tasks.set('after_hours', afterHoursTask);
    this.tasks.set('market_open', marketOpenTask);
    this.tasks.set('market_close', marketCloseTask);

    // Start tasks
    for (const [name, task] of this.tasks) {
      task.start();
      console.log(`Started BIST task: ${name}`);
    }

    // Update next run timestamps
    this.updateNextRunTimestamps();
  }

  /**
   * Run a scheduled job
   */
  private async runJob(interval: string): Promise<BISTJobResult> {
    const start = Date.now();
    const result: BISTJobResult = {
      success: false,
      dataCount: 0,
      errors: [],
      duration: 0,
      timestamp: start
    };

    try {
      bistReaderActiveJobs.inc({ source: 'all' });
      bistReaderSchedulerRunsTotal.inc({ interval, status: 'started' });

      // Fetch data
      const rawData = await this.fetcher.fetchData();
      
      // Normalize data
      const normalizedData = this.normalizer.normalizeBatch(rawData);
      
      // Filter by configured symbols
      const filteredData = this.normalizer.filterBySymbols(
        normalizedData, 
        this.config.symbols
      );

      result.success = true;
      result.dataCount = filteredData.length;
      result.duration = Date.now() - start;

      // Update metrics
      bistReaderSchedulerRunsTotal.inc({ interval, status: 'success' });
      bistReaderLastRunTimestamp.set({ source: 'all' }, start);

      // Emit data
      this.emit('data', filteredData);
      this.emit('jobComplete', result);

      console.log(`BIST job completed: ${filteredData.length} symbols, ${result.duration}ms`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.duration = Date.now() - start;

      bistReaderSchedulerRunsTotal.inc({ interval, status: 'failed' });
      
      console.error(`BIST job failed:`, error);
      this.emit('jobError', result);

    } finally {
      bistReaderActiveJobs.dec({ source: 'all' });
    }

    return result;
  }

  /**
   * Check if market is open
   */
  private isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Market is closed on weekends
    if (day === 0 || day === 6) {
      return false;
    }

    const time = now.toTimeString().slice(0, 5); // HH:MM format
    const { open, close } = this.schedulerConfig.marketHours;
    
    return time >= open && time <= close;
  }

  /**
   * Update market status metric
   */
  private updateMarketStatus(): void {
    const isOpen = this.isMarketOpen();
    bistReaderMarketStatus.set({ market: 'bist' }, isOpen ? 1 : 0);
  }

  /**
   * Update next run timestamps
   */
  private updateNextRunTimestamps(): void {
    const now = Date.now();
    
    // Calculate next run times (simplified)
    const nextMarketRun = now + (this.schedulerConfig.intervals.marketOpen * 60 * 1000);
    const nextAfterHoursRun = now + (this.schedulerConfig.intervals.afterHours * 60 * 1000);
    
    bistReaderNextRunTimestamp.set({ interval: 'market_hours' }, nextMarketRun);
    bistReaderNextRunTimestamp.set({ interval: 'after_hours' }, nextAfterHoursRun);
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    isMarketOpen: boolean;
    activeTasks: string[];
    lastRun: number;
  } {
    return {
      isRunning: this.isRunning,
      isMarketOpen: this.isMarketOpen(),
      activeTasks: Array.from(this.tasks.keys()),
      lastRun: Date.now() // This would be tracked properly in a real implementation
    };
  }

  /**
   * Force run a job (for testing)
   */
  async forceRun(interval: string = 'manual'): Promise<BISTJobResult> {
    return this.runJob(interval);
  }
}
