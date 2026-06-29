import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  trace?: string;
  metadata?: any;
}

@Injectable()
export class LoggingService implements NestLoggerService {
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly logFile = path.join(this.logsDir, 'app.log');
  private readonly errorLogFile = path.join(this.logsDir, 'error.log');

  constructor() {
    this.ensureLogsDir();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Format log entry
   */
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, context, message, trace, metadata } = entry;
    let log = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
      log += ` [${context}]`;
    }

    log += ` ${message}`;

    if (trace) {
      log += `\n${trace}`;
    }

    if (metadata) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return log + '\n';
  }

  /**
   * Write log to file
   */
  private writeToFile(logEntry: LogEntry, isError: boolean = false): void {
    const logText = this.formatLog(logEntry);
    const file = isError ? this.errorLogFile : this.logFile;

    fs.appendFileSync(file, logText);
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
    metadata?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      trace,
      metadata,
    };
  }

  /**
   * Log a message
   */
  log(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    console.log(this.formatLog(entry));
    this.writeToFile(entry);
  }

  /**
   * Log an error
   */
  error(message: string, trace?: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, trace);
    console.error(this.formatLog(entry));
    this.writeToFile(entry, true);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatLog(entry));
    this.writeToFile(entry);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.debug(this.formatLog(entry));
      this.writeToFile(entry);
    }
  }

  /**
   * Log verbose information
   */
  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry(LogLevel.VERBOSE, message, context);
      console.log(this.formatLog(entry));
      this.writeToFile(entry);
    }
  }

  /**
   * Log with metadata
   */
  logWithMetadata(
    level: LogLevel,
    message: string,
    metadata: any,
    context?: string,
  ): void {
    const entry = this.createLogEntry(
      level,
      message,
      context,
      undefined,
      metadata,
    );
    console.log(this.formatLog(entry));
    this.writeToFile(entry, level === LogLevel.ERROR);
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ): void {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    this.log(message, 'HTTP');
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      const message = `Query executed in ${duration}ms`;
      this.logWithMetadata(LogLevel.DEBUG, message, { query }, 'Database');
    }
  }

  /**
   * Clear old logs (older than specified days)
   */
  clearOldLogs(days: number = 30): void {
    const files = fs.readdirSync(this.logsDir);
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        this.log(`Deleted old log file: ${file}`, 'LoggingService');
      }
    });
  }
}
