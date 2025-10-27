import type { StrategyDefinition } from "@spark/types";
export type { StrategyDefinition } from "@spark/types";

export function generateStrategy(def: StrategyDefinition): string { 
  return JSON.stringify(def); 
}

export function parseStrategy(src: string): StrategyDefinition | null { 
  try { 
    return JSON.parse(src) as StrategyDefinition; 
  } catch { 
    return null; 
  } 
}

export class StrategyCodeGenerator {
  static generate(def: StrategyDefinition): string {
    return generateStrategy(def);
  }
  
  static parse(src: string): StrategyDefinition | null {
    return parseStrategy(src);
  }
} 

// Auto-generated barrel exports
export * from './generate.js';
