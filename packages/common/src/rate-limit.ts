class TokenBucket {
  private tokens: number;
  private last: number;
  
  constructor(private capacity: number, private refillPerSec: number) {
    this.tokens = capacity;
    this.last = Date.now();
  }
  
  private refill() {
    const now = Date.now();
    const delta = (now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillPerSec);
    this.last = now;
  }
  
  async take(cost = 1) {
    for (;;) {
      this.refill();
      if (this.tokens >= cost) { 
        this.tokens -= cost; 
        return; 
      }
      const waitMs = Math.max(50, Math.ceil(((cost - this.tokens)/this.refillPerSec) * 1000));
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

export { TokenBucket }; 