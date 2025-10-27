import WebSocket from 'ws';
import { metrics } from './metrics.js';

class WSClient {
  private binanceWs: WebSocket | null = null;
  private btcturkWs: WebSocket | null = null;
  private reconnectInterval = 5000;
  private isRunning = false;

  start() {
    this.isRunning = true;
    this.connectBinance();
    this.connectBtcturk();
  }

  stop() {
    this.isRunning = false;
    this.binanceWs?.close();
    this.btcturkWs?.close();
  }

  private connectBinance() {
    if (!this.isRunning) return;

    try {
      this.binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade');
      
      this.binanceWs.on('open', () => {
        console.log('Binance WebSocket connected');
        metrics.wsConnState.set({ exchange: 'binance', channel: 'aggTrade' }, 1);
      });

      this.binanceWs.on('message', (data) => {
        const startTime = Date.now();
        
        try {
          const message = JSON.parse(data.toString());
          
          // Mesaj sayısını artır
          metrics.wsMessagesTotal.inc({ exchange: 'binance', channel: 'aggTrade' });
          
          // Ingest latency ölç
          const latency = Date.now() - startTime;
          metrics.ingestLatencyMs.observe({ exchange: 'binance', channel: 'aggTrade' }, latency);
          
          // Gap hesapla (basit simülasyon)
          const gap = Math.random() * 100; // 0-100ms arası rastgele gap
          metrics.wsGapMs.observe({ exchange: 'binance', channel: 'aggTrade' }, gap);
          
        } catch (err) {
          console.error('Binance message parse error:', err);
        }
      });

      this.binanceWs.on('close', () => {
        console.log('Binance WebSocket disconnected');
        metrics.wsConnState.set({ exchange: 'binance', channel: 'aggTrade' }, 0);
        
        if (this.isRunning) {
          setTimeout(() => this.connectBinance(), this.reconnectInterval);
        }
      });

      this.binanceWs.on('error', (err) => {
        console.error('Binance WebSocket error:', err);
        metrics.wsConnState.set({ exchange: 'binance', channel: 'aggTrade' }, 0);
      });

    } catch (err) {
      console.error('Failed to connect to Binance:', err);
      if (this.isRunning) {
        setTimeout(() => this.connectBinance(), this.reconnectInterval);
      }
    }
  }

  private connectBtcturk() {
    if (!this.isRunning) return;

    try {
      // BTCTurk WebSocket endpoint (simülasyon)
      this.btcturkWs = new WebSocket('wss://ws-feed-pro.btcturk.com/ws');
      
      this.btcturkWs.on('open', () => {
        console.log('BTCTurk WebSocket connected');
        metrics.wsConnState.set({ exchange: 'btcturk', channel: 'ticker' }, 1);
      });

      this.btcturkWs.on('message', (data) => {
        const startTime = Date.now();
        
        try {
          const message = JSON.parse(data.toString());
          
          // Mesaj sayısını artır
          metrics.wsMessagesTotal.inc({ exchange: 'btcturk', channel: 'ticker' });
          
          // Ingest latency ölç
          const latency = Date.now() - startTime;
          metrics.ingestLatencyMs.observe({ exchange: 'btcturk', channel: 'ticker' }, latency);
          
          // Gap hesapla
          const gap = Math.random() * 150; // 0-150ms arası rastgele gap
          metrics.wsGapMs.observe({ exchange: 'btcturk', channel: 'ticker' }, gap);
          
        } catch (err) {
          console.error('BTCTurk message parse error:', err);
        }
      });

      this.btcturkWs.on('close', () => {
        console.log('BTCTurk WebSocket disconnected');
        metrics.wsConnState.set({ exchange: 'btcturk', channel: 'ticker' }, 0);
        
        if (this.isRunning) {
          setTimeout(() => this.connectBtcturk(), this.reconnectInterval);
        }
      });

      this.btcturkWs.on('error', (err) => {
        console.error('BTCTurk WebSocket error:', err);
        metrics.wsConnState.set({ exchange: 'btcturk', channel: 'ticker' }, 0);
      });

    } catch (err) {
      console.error('Failed to connect to BTCTurk:', err);
      if (this.isRunning) {
        setTimeout(() => this.connectBtcturk(), this.reconnectInterval);
      }
    }
  }
}

export const wsClient = new WSClient();