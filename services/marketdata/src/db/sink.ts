// DB Sink
// Prisma opsiyonel: PRISMA_DATABASE_URL yoksa JSONL fallback

import { eventToDbMs } from '../metrics.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface MarketEvent {
  id?: string;
  source: string;
  type: string;
  symbol: string;
  ts: number;
  payload: any;
}

export interface Tick {
  id?: string;
  source: string;
  symbol: string;
  ts: number;
  price: number;
  volume: number;
}

export class DBSink {
  private dbMode: 'prisma' | 'jsonl';
  private jsonlDir: string;

  constructor() {
    this.dbMode = process.env.PRISMA_DATABASE_URL ? 'prisma' : 'jsonl';
    this.jsonlDir = 'data/feeds';
  }

  async writeEvent(event: MarketEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (this.dbMode === 'prisma') {
        await this.writeEventToPrisma(event);
      } else {
        await this.writeEventToJSONL(event);
      }
      
      const latency = Date.now() - startTime;
      eventToDbMs.observe({ table: 'events' }, latency);
      
    } catch (error) {
      console.error('DB write error:', error);
      throw error;
    }
  }

  async writeTick(tick: Tick): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (this.dbMode === 'prisma') {
        await this.writeTickToPrisma(tick);
      } else {
        await this.writeTickToJSONL(tick);
      }
      
      const latency = Date.now() - startTime;
      eventToDbMs.observe({ table: 'ticks' }, latency);
      
    } catch (error) {
      console.error('DB write error:', error);
      throw error;
    }
  }

  private async writeEventToPrisma(event: MarketEvent): Promise<void> {
    // TODO: Implement Prisma write
    // const prisma = new PrismaClient();
    // await prisma.marketEvent.create({ data: event });
    console.log('Prisma write (not implemented):', event);
  }

  private async writeEventToJSONL(event: MarketEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `events-${today}.jsonl`;
    const filepath = join(this.jsonlDir, filename);
    
    await mkdir(this.jsonlDir, { recursive: true });
    await writeFile(filepath, JSON.stringify(event) + '\n', { flag: 'a' });
  }

  private async writeTickToPrisma(tick: Tick): Promise<void> {
    // TODO: Implement Prisma write
    // const prisma = new PrismaClient();
    // await prisma.tick.create({ data: tick });
    console.log('Prisma write (not implemented):', tick);
  }

  private async writeTickToJSONL(tick: Tick): Promise<void> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `ticks-${today}.jsonl`;
    const filepath = join(this.jsonlDir, filename);
    
    await mkdir(this.jsonlDir, { recursive: true });
    await writeFile(filepath, JSON.stringify(tick) + '\n', { flag: 'a' });
  }

  // Legacy method for backward compatibility
  async write(event: any): Promise<void> {
    const marketEvent: MarketEvent = {
      source: event.source || 'unknown',
      type: event.type || 'unknown',
      symbol: event.symbol || 'unknown',
      ts: event.ts || Date.now(),
      payload: event
    };
    
    await this.writeEvent(marketEvent);
  }
}
