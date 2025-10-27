export type LogEvent = {
    type: 'heartbeat';
    ts: string;
} | {
    type: 'progress';
    step: string;
    value: number;
    ts: string;
};
export declare const sseSerialize: (event: LogEvent) => string;
//# sourceMappingURL=events.d.ts.map