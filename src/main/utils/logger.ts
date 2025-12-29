export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export class Logger {
  constructor(private readonly scope: string) {}

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString()
    const suffix = meta ? ` ${JSON.stringify(meta)}` : ''
    // eslint-disable-next-line no-console
    console[level](`[${timestamp}] [${this.scope}] ${message}${suffix}`)
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta)
  }
}
