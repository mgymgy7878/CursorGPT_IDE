export type LogEvent = { type: 'heartbeat'; ts: string } | { type: 'progress'; step: string; value: number; ts: string };
export const sseSerialize = (event: LogEvent) => `data: ${JSON.stringify(event)}\n\n`; 

