import type { Logger } from '../../application/ports/Logger.js';

/**
 * Console-based logger implementation.
 * Outputs log messages to the console with appropriate log levels.
 */
export class ConsoleLogger implements Logger {
  private readonly prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(`${this.prefix}${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix}${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix}${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix}${message}`, ...args);
  }
}
