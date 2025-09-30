declare class Logger {
    private isDev;
    private enableDebug;
    constructor();
    private format;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: Error | any, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    time(label: string): void;
    timeEnd(label: string): void;
    scope(prefix: string): {
        info: (msg: string, ...args: any[]) => void;
        warn: (msg: string, ...args: any[]) => void;
        error: (msg: string, err?: Error, ...args: any[]) => void;
        debug: (msg: string, ...args: any[]) => void;
        success: (msg: string, ...args: any[]) => void;
    };
    group(label: string, collapsed?: boolean): void;
    groupEnd(): void;
    table(data: any): void;
}
export declare const logger: Logger;
export default logger;
