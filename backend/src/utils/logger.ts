import fs from "fs";
import path from "path";

// Log level enum
export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      this.level = envLevel as LogLevel;
    }
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      level: entry.level,
      timestamp: entry.timestamp,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.formatEntry(entry);

    // Console output
    const consoleColor = this.getConsoleColor(entry.level);
    console.log(`${consoleColor}${formatted}\x1b[0m`);

    // File output (always write to files regardless of log level)
    try {
      const logFile = path.join(logsDir, `${entry.level.toLowerCase()}.log`);
      fs.appendFileSync(logFile, formatted + "\n");

      // Also write to combined log
      const combinedFile = path.join(logsDir, "combined.log");
      fs.appendFileSync(combinedFile, formatted + "\n");
    } catch (err) {
      console.error("Failed to write to log file:", err);
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return "\x1b[31m"; // Red
      case LogLevel.WARN:
        return "\x1b[33m"; // Yellow
      case LogLevel.INFO:
        return "\x1b[32m"; // Green
      case LogLevel.DEBUG:
        return "\x1b[36m"; // Cyan
      case LogLevel.TRACE:
        return "\x1b[35m"; // Magenta
      default:
        return "\x1b[0m"; // Reset
    }
  }

  error(message: string, context?: string, error?: Error): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error ? { message: error.message, stack: error.stack } : undefined,
    });
  }

  warn(message: string, context?: string, data?: any): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      data,
    });
  }

  info(message: string, context?: string, data?: any): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      data,
    });
  }

  debug(message: string, context?: string, data?: any): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      data,
    });
  }

  trace(message: string, context?: string, data?: any): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: LogLevel.TRACE,
      message,
      context,
      data,
    });
  }

  // Special method for database queries (for performance monitoring)
  query(query: string, duration: number, params?: any): void {
    if (duration > 100) {
      // Log slow queries
      this.warn(`Slow query (${duration}ms)`, "DATABASE", {
        query: query.substring(0, 200), // Truncate long queries
        duration,
        params: params ? JSON.stringify(params).substring(0, 200) : undefined,
      });
    } else if (this.shouldLog(LogLevel.TRACE)) {
      this.trace(`Query executed (${duration}ms)`, "DATABASE", {
        query: query.substring(0, 200),
        duration,
      });
    }
  }

  // Special method for API requests (for performance monitoring)
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ip?: string
  ): void {
    const data = {
      method,
      path,
      statusCode,
      duration,
      userId,
      ip,
    };

    if (statusCode >= 400) {
      this.warn(`API request error`, "API", data);
    } else if (duration > 1000) {
      this.warn(`Slow API request (${duration}ms)`, "API", data);
    } else {
      this.info(`API request completed`, "API", data);
    }
  }

  // Special method for authentication events
  auth(action: string, email: string, success: boolean, ip?: string, reason?: string): void {
    this.info(`Auth ${action}`, "AUTH", {
      action,
      email,
      success,
      ip,
      reason: reason ? reason.substring(0, 100) : undefined,
    });
  }

  // Special method for security events
  security(event: string, severity: "LOW" | "MEDIUM" | "HIGH", details?: any): void {
    const data = { severity, ...details };
    if (severity === "HIGH") {
      this.error(event, "SECURITY", new Error(JSON.stringify(data)));
    } else if (severity === "MEDIUM") {
      this.warn(event, "SECURITY", data);
    } else {
      this.info(event, "SECURITY", data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
