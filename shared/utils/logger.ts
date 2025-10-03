type LogLevel = "info" | "warn" | "error" | "debug" | "success";

interface LogOptions {
  timestamp?: boolean;
  stack?: boolean;
}

class Logger {
  private isDev: boolean;
  private enableDebug: boolean;

  constructor() {
    const metaEnv = (import.meta as any)?.env;
    const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process;
    const processEnv = globalProcess?.env;
    const explicitDev = typeof metaEnv?.DEV === "boolean" ? metaEnv.DEV : undefined;
    const inferredDev = processEnv?.NODE_ENV ? processEnv.NODE_ENV !== "production" : undefined;
    this.isDev = explicitDev ?? inferredDev ?? false;
    const debugRaw = metaEnv?.DEBUG ?? processEnv?.DEBUG;
    this.enableDebug = debugRaw === "true" || debugRaw === true || this.isDev;
  }
  private format(level: LogLevel, message: string, options: LogOptions = {}): string {
    const parts: string[] = [];

    if (options.timestamp !== false) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    const levelEmoji = {
      info: "ℹ️",
      warn: "⚠️",
      error: "🚨",
      debug: "🔍",
      success: "✅",
    };
    parts.push(`${levelEmoji[level]} [${level.toUpperCase()}]`);

    parts.push(message);

    return parts.join(" ");
  }

  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(this.format("info", message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.format("warn", message), ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    console.error(this.format("error", message), ...args);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    } else if (error) {
      console.error("Error details:", error);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.enableDebug) {
      console.log(this.format("debug", message), ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(this.format("success", message), ...args);
    }
  }

  time(label: string): void {
    console.time(`⏱️  ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`⏱️  ${label}`);
  }

  scope(prefix: string) {
    return {
      info: (msg: string, ...args: any[]) => this.info(`[${prefix}] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => this.warn(`[${prefix}] ${msg}`, ...args),
      error: (msg: string, err?: Error, ...args: any[]) =>
        this.error(`[${prefix}] ${msg}`, err, ...args),
      debug: (msg: string, ...args: any[]) => this.debug(`[${prefix}] ${msg}`, ...args),
      success: (msg: string, ...args: any[]) => this.success(`[${prefix}] ${msg}`, ...args),
    };
  }

  group(label: string, collapsed: boolean = false): void {
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  groupEnd(): void {
    console.groupEnd();
  }

  table(data: any): void {
    if (this.isDev) {
      console.table(data);
    }
  }
}

export const logger = new Logger();

export default logger;
