/**
 * Platform Detection Utility
 * Detects the current hosting platform (Emergent, Replit, Local)
 * and provides platform-specific configuration
 */

export interface PlatformInfo {
  name: 'Emergent' | 'Replit' | 'Local';
  isEmergent: boolean;
  isReplit: boolean;
  isLocal: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  env: Record<string, string | undefined>;
}

class Platform {
  private _isEmergent: boolean;
  private _isReplit: boolean;
  private _isProduction: boolean;
  private _isDevelopment: boolean;

  constructor() {
    // Detect Emergent (Kubernetes environment)
    this._isEmergent = !!(
      process.env.KUBERNETES_SERVICE_HOST || 
      process.env.EMERGENT_ENV
    );

    // Detect Replit
    this._isReplit = !!(
      process.env.REPL_ID || 
      process.env.REPL_SLUG || 
      process.env.REPLIT_DB_URL
    );

    // Environment detection
    this._isProduction = process.env.NODE_ENV === 'production';
    this._isDevelopment = process.env.NODE_ENV === 'development';
  }

  get isEmergent(): boolean {
    return this._isEmergent;
  }

  get isReplit(): boolean {
    return this._isReplit;
  }

  get isLocal(): boolean {
    return !this._isEmergent && !this._isReplit;
  }

  get isProduction(): boolean {
    return this._isProduction;
  }

  get isDevelopment(): boolean {
    return this._isDevelopment;
  }

  get name(): 'Emergent' | 'Replit' | 'Local' {
    if (this._isEmergent) return 'Emergent';
    if (this._isReplit) return 'Replit';
    return 'Local';
  }

  get port(): number {
    // Priority: explicit PORT > Replit default 5000 > Emergent default 3000
    const explicitPort = process.env.PORT;
    if (explicitPort) return Number(explicitPort);
    
    if (this._isReplit) return 5000;
    if (this._isEmergent) return 3000;
    return 3000; // Local default
  }

  get info(): PlatformInfo {
    return {
      name: this.name,
      isEmergent: this.isEmergent,
      isReplit: this.isReplit,
      isLocal: this.isLocal,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      port: this.port,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        KUBERNETES_SERVICE_HOST: process.env.KUBERNETES_SERVICE_HOST,
        REPL_ID: process.env.REPL_ID
      }
    };
  }

  /**
   * Log platform information to console
   */
  log(): void {
    console.log('🌍 Platform Information:');
    console.log(`   Environment: ${this.name}`);
    console.log(`   Mode: ${this.isProduction ? 'Production' : 'Development'}`);
    console.log(`   Port: ${this.port}`);
  }

  /**
   * Get platform-specific configuration
   */
  getConfig<T>(config: {
    emergent: T;
    replit: T;
    local: T;
  }): T {
    if (this.isEmergent) return config.emergent;
    if (this.isReplit) return config.replit;
    return config.local;
  }
}

// Export singleton instance
export const platform = new Platform();

// Export as default
export default platform;