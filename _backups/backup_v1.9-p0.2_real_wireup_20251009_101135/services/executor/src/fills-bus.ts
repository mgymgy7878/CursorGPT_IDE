import EventEmitter from "node:events";
import type { FillEvent as TypesFillEvent } from "@spark/types";

export type ExchangeKey = 'binance'|'btcturk';
export type FillStart = { ex:ExchangeKey; symbol:string; orderId?:string|number; clientOrderId?:string; t0:number };
export type FillEvent = TypesFillEvent;

class FillsBus extends EventEmitter {
	markStart(p:FillStart){ this.emit('start', p); }
	markFill(p:FillEvent){ this.emit('fill', p); }
}

export const fillsBus = new FillsBus(); 