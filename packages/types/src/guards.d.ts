export declare const isObj: (x: unknown) => x is Record<string, unknown>;
export interface Trade {
    id: string;
    symbol: string;
    price: number;
    qty: number;
    ts: number;
}
export declare const isTrade: (x: unknown) => x is Trade;
export interface Strategy {
    id: string;
    name: string;
    code?: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
}
export declare const isStrategy: (x: unknown) => x is Strategy;
export interface Draft {
    name: string;
    symbol: string;
    params: Record<string, number>;
}
export declare const isDraft: (x: unknown) => x is Draft;
export interface Role {
    id: string;
    name: string;
    permissions: string[];
}
export declare const isRole: (x: unknown) => x is Role;
