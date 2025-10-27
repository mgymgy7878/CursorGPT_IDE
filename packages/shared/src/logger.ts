export type LogLevel = 'info' | 'warn' | 'error';
export const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const line = JSON.stringify({ level, message, meta, ts: new Date().toISOString() });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}; 

