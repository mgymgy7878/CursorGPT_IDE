/**
 * SSE Delta Throttle
 * "Değişim yoksa sessiz kal" - Gereksiz network trafiğini azalt
 * 
 * Emit kriteri:
 * - Zaman delta >250ms VEYA
 * - Fiyat değişimi >0.05%
 */

interface Tick {
  price: number;
  timestamp: number;
}

let lastEmittedTick: Tick = { price: 0, timestamp: 0 };

/**
 * Verilen tick'in emit edilmesi gerekip gerekmediğini belirler
 */
export const shouldEmitTick = (tick: Tick): boolean => {
  const dt = tick.timestamp - lastEmittedTick.timestamp;
  const dp = Math.abs(tick.price - lastEmittedTick.price);
  const pct = lastEmittedTick.price ? dp / lastEmittedTick.price : 1;
  
  // Emit if: time delta >250ms OR price change >0.05%
  const shouldEmit = dt > 250 || pct > 0.0005;
  
  if (shouldEmit) {
    lastEmittedTick = tick;
  }
  
  return shouldEmit;
};

/**
 * Throttle state'ini sıfırla (test/reset için)
 */
export const resetThrottle = () => {
  lastEmittedTick = { price: 0, timestamp: 0 };
};

/**
 * Son emit edilen tick'i döndür (monitoring için)
 */
export const getLastEmittedTick = (): Tick => {
  return { ...lastEmittedTick };
};

