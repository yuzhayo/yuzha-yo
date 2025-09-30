/**
 * Logging Utility
 * Provides structured logging with platform awareness
 */

import { platform } from './platform';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogOptions {
  timestamp?: boolean;
  platform?: boolean;
  stack?: boolean;
}

class Logger {
  private isDev: boolean;
  private enableDebug: boolean;

  constructor() {
    this.isDev = platform.isDevelopment;
    this.enableDebug = process.env.DEBUG === 'true' || this.isDev;
  }

  private format(level: LogLevel, message: string, options: LogOptions = {}): string {
    const parts: string[] = [];

    // Add timestamp if requested
    if (options.timestamp !== false) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // Add platform info if requested
    if (options.platform) {
      parts.push(`[${platform.name}]`);
    }

    // Add log level
    const levelEmoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '🚨',
      debug: '🔍',
      success: '✅'
    };
    parts.push(`${levelEmoji[level]} [${level.toUpperCase()}]`);

    // Add message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(this.format('info', message), ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(this.format('warn', message), ...args);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    console.error(this.format('error', message), ...args);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    } else if (error) {
      console.error('Error details:', error);
    }
  }

  /**
   * Log debug message (only in development or when DEBUG=true)
   */
  debug(message: string, ...args: any[]): void {
    if (this.enableDebug) {
      console.log(this.format('debug', message), ...args);
    }
  }

  /**
   * Log success message
   */
  success(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(this.format('success', message), ...args);
    }
  }

  /**
   * Log platform information
   */
  platform(): void {
    console.log('\n' + '='.repeat(50));
    console.log('🌍 Platform Information');
    console.log('='.repeat(50));
    console.log(`Environment: ${platform.name}`);
    console.log(`Mode: ${platform.isProduction ? 'Production' : 'Development'}`);
    console.log(`Port: ${platform.port}`);
    console.log(`Is Emergent: ${platform.isEmergent}`);
    console.log(`Is Replit: ${platform.isReplit}`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Log performance timing
   */
  time(label: string): void {
    console.time(`⏱️  ${label}`);
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    console.timeEnd(`⏱️  ${label}`);
  }

  /**
   * Create a scoped logger with prefix
   */
  scope(prefix: string) {
    return {
      info: (msg: string, ...args: any[]) => this.info(`[${prefix}] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => this.warn(`[${prefix}] ${msg}`, ...args),
      error: (msg: string, err?: Error, ...args: any[]) => this.error(`[${prefix}] ${msg}`, err, ...args),
      debug: (msg: string, ...args: any[]) => this.debug(`[${prefix}] ${msg}`, ...args),
      success: (msg: string, ...args: any[]) => this.success(`[${prefix}] ${msg}`, ...args)
    };
  }

  /**
   * Group related logs
   */
  group(label: string, collapsed: boolean = false): void {
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    console.groupEnd();
  }

  /**
   * Log table data
   */
  table(data: any): void {
    if (this.isDev) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export as default
export default logger;