// Branded types for type safety
export type OrderId = string & { readonly __brand: 'OrderId' };
export type Symbol = string & { readonly __brand: 'Symbol' };
export type Price = number & { readonly __brand: 'Price' };
export type Quantity = number & { readonly __brand: 'Quantity' };

// Type constructors
export const asOrderId = (s: string): OrderId => s as OrderId;
export const asSymbol = (s: string): Symbol => s as Symbol;
export const asPrice = (n: number): Price => n as Price;
export const asQuantity = (n: number): Quantity => n as Quantity; 