import { EventEmitter } from "node:events";
/** Evrensel event map — ihtiyaçlarına göre genişlet. */
export type LabEvents = {
    "backtest:started": {
        id: string;
        symbol: string;
        timeframe: string;
        ts: number;
    };
    "backtest:progress": {
        id: string;
        done: number;
        total: number;
        ts: number;
    };
    "backtest:finished": {
        id: string;
        stats: Record<string, number>;
        ts: number;
    };
    "trade:opened": {
        symbol: string;
        side: "BUY" | "SELL";
        qty: number;
        price: number;
        ts: number;
        id: string;
    };
    "trade:closed": {
        id: string;
        pnl: number;
        reason: "take-profit" | "stop-loss" | "manual" | "guardrail";
        ts: number;
    };
    "order:ack": {
        clientOrderId: string;
        exchange: string;
        ts: number;
    };
    "order:rejected": {
        clientOrderId: string;
        code: string;
        msg: string;
        ts: number;
    };
    "risk:alert": {
        kind: "kill-switch" | "rate-cap" | "whitelist";
        message: string;
        ts: number;
    };
    "ui:toast": {
        level: "info" | "warn" | "error" | "success";
        message: string;
        ts: number;
    };
    "lab:job:start": {
        type: string;
        id: string;
    };
    "lab:job:progress": {
        id: string;
        progress: number;
    };
    "lab:job:done": {
        id: string;
    };
    "lab:editor:refresh": void;
    "lab:open:backtest": {
        strategy?: string;
        id?: string;
        code?: string;
    };
    "lab:open:optimize": {
        strategy?: string;
        id?: string;
        code?: string;
    };
    "lab:open:run": {
        strategy?: string;
        id?: string;
        code?: string;
    };
};
/** Tipli emitter arayüzü — on/once/off/emit tamamı tür emniyetli. */
export interface TypedEmitter<M extends Record<string, any>> {
    on<K extends keyof M>(event: K, listener: (payload: M[K]) => void): this;
    once<K extends keyof M>(event: K, listener: (payload: M[K]) => void): this;
    off<K extends keyof M>(event: K, listener: (payload: M[K]) => void): this;
    emit<K extends keyof M>(event: K, payload: M[K]): boolean;
}
/** Node EventEmitter'ı tipli sarmalayıcıyla döndürür. */
export declare function createTypedEmitter<M extends Record<string, any>>(): EventEmitter & TypedEmitter<M>;
/** Projenin varsayılan event haritası. */
export type SparkEvents = LabEvents;
