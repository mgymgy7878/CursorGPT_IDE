type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private level: LogLevel

  constructor(level?: LogLevel) {
    const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL || 'info').toLowerCase()
    this.level = (level || envLevel) as LogLevel
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
    return order[messageLevel] >= order[this.level]
  }

  private prefix(messageLevel: LogLevel): string {
    const ts = new Date().toISOString()
    return `[${ts}] [${messageLevel.toUpperCase()}]`
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) console.debug(this.prefix('debug'), ...args)
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) console.info(this.prefix('info'), ...args)
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) console.warn(this.prefix('warn'), ...args)
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) console.error(this.prefix('error'), ...args)
  }
}

const logger = new Logger()
export default logger
export { Logger } 