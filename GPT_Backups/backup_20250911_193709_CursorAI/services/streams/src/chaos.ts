import { ChaosConfig } from "./types";
import { streamsIngestLagSeconds, streamsSeqGapTotal } from "./metrics";

export class ChaosInjector {
  private activeChaos: ChaosConfig | null = null;
  private chaosStartTime: number = 0;

  injectChaos(config: ChaosConfig): void {
    this.activeChaos = config;
    this.chaosStartTime = Date.now();
    
    console.log(`Chaos injected: ${config.mode} for ${config.duration}ms with intensity ${config.intensity}`);
    
    switch (config.mode) {
      case 'lag':
        this.injectLag(config.intensity);
        break;
      case 'gap':
        this.injectGap();
        break;
      case 'drop':
        this.injectDrop(config.intensity);
        break;
    }
    
    // Auto-resolve after duration
    setTimeout(() => {
      this.resolveChaos();
    }, config.duration);
  }

  private injectLag(intensity: number): void {
    // Simulate lag by artificially increasing ingest lag
    const lagSpike = intensity * 1000; // Convert to milliseconds
    streamsIngestLagSeconds.set({ src: 'binance', symbol: 'BTCUSDT' }, lagSpike / 1000);
    console.log(`Lag spike injected: ${lagSpike}ms`);
  }

  private injectGap(): void {
    // Simulate sequence gap
    streamsSeqGapTotal.inc({ src: 'binance', symbol: 'BTCUSDT' });
    console.log('Sequence gap injected');
  }

  private injectDrop(intensity: number): void {
    // Simulate message drops by reducing message count
    // In real implementation, this would drop actual messages
    console.log(`Drop rate injected: ${intensity * 100}%`);
  }

  private resolveChaos(): void {
    if (this.activeChaos) {
      console.log(`Chaos resolved: ${this.activeChaos.mode}`);
      
      // Reset metrics to normal values
      if (this.activeChaos.mode === 'lag') {
        streamsIngestLagSeconds.set({ src: 'binance', symbol: 'BTCUSDT' }, 0.1);
      }
      
      this.activeChaos = null;
      this.chaosStartTime = 0;
    }
  }

  getActiveChaos(): ChaosConfig | null {
    return this.activeChaos;
  }

  getChaosDuration(): number {
    if (this.activeChaos && this.chaosStartTime > 0) {
      return Date.now() - this.chaosStartTime;
    }
    return 0;
  }
} 