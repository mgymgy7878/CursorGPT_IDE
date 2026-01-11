/**
 * Global Ticker Hook - Single source of truth for time updates
 *
 * Prevents multiple setInterval instances when many ClientTime components
 * use format="relative". All components subscribe to a single 1Hz ticker.
 *
 * Features:
 * - Ref-count: Stops when no subscribers
 * - Visibility throttle: Slows down when tab is hidden
 * - Smart updates: Only updates when needed
 */

import { useEffect, useState } from 'react';

let globalTicker: NodeJS.Timeout | null = null;
let subscribers = new Set<() => void>();
let lastTick = Date.now();
let isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;

// Update visibility state
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    // If tab becomes visible, update immediately
    if (isTabVisible && subscribers.size > 0) {
      lastTick = Date.now();
      subscribers.forEach(cb => cb());
    }
  });
}

/**
 * Subscribe to global ticker
 * - Visible: 1Hz (every 1 second)
 * - Hidden: 0.2Hz (every 5 seconds)
 * Returns current timestamp
 */
export function useGlobalTicker(): number {
  const [tick, setTick] = useState(lastTick);

  useEffect(() => {
    const update = () => setTick(Date.now());

    subscribers.add(update);

    // Start ticker if this is the first subscriber
    if (globalTicker === null) {
      globalTicker = setInterval(() => {
        // Throttle updates when tab is hidden
        const interval = isTabVisible ? 1000 : 5000;

        // Only update if enough time has passed
        const now = Date.now();
        if (now - lastTick >= interval) {
          lastTick = now;
          subscribers.forEach(cb => cb());
        }
      }, 1000); // Check every second, but only update based on visibility
    }

    // Initial update
    update();

    return () => {
      subscribers.delete(update);

      // Stop ticker if no more subscribers (ref-count)
      if (subscribers.size === 0 && globalTicker !== null) {
        clearInterval(globalTicker);
        globalTicker = null;
      }
    };
  }, []);

  return tick;
}

