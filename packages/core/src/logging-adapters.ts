/**
 * Optional logging adapters for popular platforms
 * Import only what you need to keep bundle size minimal
 */

/**
 * Console logger for development
 */
export function createConsoleLogger(structured = true) {
  return (level: string, message: string, metadata: Record<string, any>) => {
    if (structured) {
      const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...metadata
      };
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }
  };
}

/**
 * Generic HTTP logger for any endpoint
 */
export function createHttpLogger(endpoint: string, headers: Record<string, string> = {}) {
  return async (level: string, message: string, metadata: Record<string, any>) => {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send log to HTTP endpoint:', error);
      console.log('FALLBACK_LOG:', JSON.stringify(payload));
    }
  };
}

/**
 * Multi-target logger - send to multiple destinations
 */
export function createMultiLogger(...loggers: Array<(level: string, message: string, metadata: Record<string, any>) => void | Promise<void>>) {
  return async (level: string, message: string, metadata: Record<string, any>) => {
    const promises = loggers.map(logger => {
      try {
        return Promise.resolve(logger(level, message, metadata));
      } catch (error) {
        console.error('Logger failed:', error);
        return Promise.resolve();
      }
    });
    
    await Promise.allSettled(promises);
  };
} 