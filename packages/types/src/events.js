// packages/types/src/events.ts
import { EventEmitter } from "node:events";
/** Node EventEmitter'ı tipli sarmalayıcıyla döndürür. */
export function createTypedEmitter() {
    const ee = new EventEmitter();
    return ee;
}
