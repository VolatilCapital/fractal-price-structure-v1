/**
 * Logger interface for injectable logging throughout the application.
 * Follows the port pattern in hexagonal architecture.
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

/**
 * No-operation logger that silently discards all log messages.
 * Use as the default logger when no logging is required.
 */
export class NoopLogger implements Logger {
  debug(_message: string, ..._args: unknown[]): void {
    // intentionally empty
  }

  info(_message: string, ..._args: unknown[]): void {
    // intentionally empty
  }

  warn(_message: string, ..._args: unknown[]): void {
    // intentionally empty
  }

  error(_message: string, ..._args: unknown[]): void {
    // intentionally empty
  }
}

/** Default singleton instance of NoopLogger */
export const noopLogger = new NoopLogger()
