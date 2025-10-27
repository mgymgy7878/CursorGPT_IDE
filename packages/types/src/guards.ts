// packages/types/src/guards.ts
export const isObj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object";

export interface Trade { 
  id: string; 
  symbol: string; 
  price: number; 
  qty: number; 
  ts: number 
}

export const isTrade = (x: unknown): x is Trade =>
  isObj(x) &&
  typeof (x as any).id === "string" &&
  typeof (x as any).symbol === "string" &&
  typeof (x as any).price === "number" &&
  typeof (x as any).qty === "number";

export interface Strategy {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export const isStrategy = (x: unknown): x is Strategy =>
  isObj(x) &&
  typeof (x as any).id === "string" &&
  typeof (x as any).name === "string" &&
  typeof (x as any).createdAt === "number" &&
  typeof (x as any).updatedAt === "number";

export interface Draft {
  name: string;
  symbol: string;
  params: Record<string, number>;
}

export const isDraft = (x: unknown): x is Draft =>
  isObj(x) &&
  typeof (x as any).name === "string" &&
  typeof (x as any).symbol === "string" &&
  isObj((x as any).params);

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export const isRole = (x: unknown): x is Role =>
  isObj(x) &&
  typeof (x as any).id === "string" &&
  typeof (x as any).name === "string" &&
  Array.isArray((x as any).permissions);