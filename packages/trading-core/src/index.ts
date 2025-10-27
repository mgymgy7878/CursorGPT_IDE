import type { Price, Quantity, Symbol, OrderId, OrderSide, TimeInForce, ExecutionReport, StrategySignal } from "@spark/types";
export type { Price, Quantity, Symbol, OrderId, OrderSide, TimeInForce, ExecutionReport, StrategySignal } from "@spark/types";
export const toPrice = (v:number|string)=> (typeof v==="number"?v:Number(v)) as Price;
export const toQty   = (v:number|string)=> (typeof v==="number"?v:Number(v)) as Quantity;
export const parseSymbol = (s:string)=> s as Symbol;
export const asOrderId = (s:string)=> s as OrderId; 