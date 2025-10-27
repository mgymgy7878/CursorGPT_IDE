/**
 * Flash highlight animation for real-time data updates
 * Adds temporary highlight class when value changes
 */

export type FlashColor = 'success' | 'danger' | 'warning' | 'info';

/**
 * Add flash highlight animation to element
 * Returns cleanup function
 */
export function flashHighlight(
  element: HTMLElement | null,
  color: FlashColor = 'success',
  duration = 1000
): () => void {
  if (!element) return () => {};

  const flashClass = `flash-${color}`;
  element.classList.add(flashClass);

  const timeout = setTimeout(() => {
    element.classList.remove(flashClass);
  }, duration);

  // Cleanup function
  return () => {
    clearTimeout(timeout);
    element.classList.remove(flashClass);
  };
}

/**
 * React hook for flash highlight on value change
 */
export function useFlashHighlight(
  ref: React.RefObject<HTMLElement>,
  value: number | string,
  options: {
    color?: FlashColor;
    duration?: number;
    enabled?: boolean;
  } = {}
) {
  const { color = 'success', duration = 1000, enabled = true } = options;
  const prevValueRef = React.useRef(value);

  React.useEffect(() => {
    if (!enabled || !ref.current) return;

    // Check if value changed
    if (prevValueRef.current !== value) {
      const cleanup = flashHighlight(ref.current, color, duration);
      prevValueRef.current = value;
      return cleanup;
    }
  }, [value, color, duration, enabled, ref]);
}

/**
 * CSS classes for flash animations
 * Add to globals.css:
 * 
 * @keyframes flash-pulse {
 *   0%, 100% { background-color: transparent; }
 *   50% { background-color: var(--flash-color); }
 * }
 * 
 * .flash-success {
 *   --flash-color: rgba(16, 185, 129, 0.2);
 *   animation: flash-pulse 1s ease-out;
 * }
 * 
 * .flash-danger {
 *   --flash-color: rgba(239, 68, 68, 0.2);
 *   animation: flash-pulse 1s ease-out;
 * }
 */

// Re-export React for convenience
import * as React from 'react';

