class Logger {
    constructor() {
        this.isDev = import.meta.env.DEV;
        this.enableDebug = import.meta.env.DEBUG === 'true' || this.isDev;
    }
    format(level, message, options = {}) {
        const parts = [];
        if (options.timestamp !== false) {
            parts.push(`[${new Date().toISOString()}]`);
        }
        const levelEmoji = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '🚨',
            debug: '🔍',
            success: '✅'
        };
        parts.push(`${levelEmoji[level]} [${level.toUpperCase()}]`);
        parts.push(message);
        return parts.join(' ');
    }
    info(message, ...args) {
        if (this.isDev) {
            console.log(this.format('info', message), ...args);
        }
    }
    warn(message, ...args) {
        console.warn(this.format('warn', message), ...args);
    }
    error(message, error, ...args) {
        console.error(this.format('error', message), ...args);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        else if (error) {
            console.error('Error details:', error);
        }
    }
    debug(message, ...args) {
        if (this.enableDebug) {
            console.log(this.format('debug', message), ...args);
        }
    }
    success(message, ...args) {
        if (this.isDev) {
            console.log(this.format('success', message), ...args);
        }
    }
    time(label) {
        console.time(`⏱️  ${label}`);
    }
    timeEnd(label) {
        console.timeEnd(`⏱️  ${label}`);
    }
    scope(prefix) {
        return {
            info: (msg, ...args) => this.info(`[${prefix}] ${msg}`, ...args),
            warn: (msg, ...args) => this.warn(`[${prefix}] ${msg}`, ...args),
            error: (msg, err, ...args) => this.error(`[${prefix}] ${msg}`, err, ...args),
            debug: (msg, ...args) => this.debug(`[${prefix}] ${msg}`, ...args),
            success: (msg, ...args) => this.success(`[${prefix}] ${msg}`, ...args)
        };
    }
    group(label, collapsed = false) {
        if (collapsed) {
            console.groupCollapsed(label);
        }
        else {
            console.group(label);
        }
    }
    groupEnd() {
        console.groupEnd();
    }
    table(data) {
        if (this.isDev) {
            console.table(data);
        }
    }
}
export const logger = new Logger();
export default logger;
