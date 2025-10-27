// SSR-safe, client-safe tekil event bus
import mitt from "mitt";
import { useState, useEffect } from "react";

export type LabEvents = {
  'lab:open:backtest': { strategy?: string, id?: string };
  'lab:open:optimize': { strategy?: string, id?: string };
  'lab:open:run':      { strategy?: string, id?: string };
  'modal:close': void;
};

// Uygulama boyunca aynı instance
const emitter = mitt<LabEvents>();

export default emitter;           // default olarak bus
export const bus = emitter;       // named olarak da bus
export const on  = emitter.on;
export const off = emitter.off;
export const emit = emitter.emit;

export function useBusTick(topic: string) {
  const [tick, setTick] = useState(0);
  useEffect(() => bus.on(topic as any, () => setTick(t => t + 1)), [topic]);
  return tick;
} 