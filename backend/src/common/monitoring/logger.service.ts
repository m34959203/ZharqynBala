import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  meta?: Record<string, any>;
  traceId?: string;
  userId?: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private traceId?: string;
  private userId?: string;
  private readonly isProduction: boolean;
  private readonly logLevel: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.logLevel = this.configService.get('LOG_LEVEL') || 'debug';
  }

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  setTraceId(traceId: string): this {
    this.traceId = traceId;
    return this;
  }

  setUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  log(message: any, ...optionalParams: any[]): void {
    this.writeLog('info', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void {
    this.writeLog('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.writeLog('warn', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    if (this.isProduction && this.logLevel !== 'debug') return;
    this.writeLog('debug', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    if (this.isProduction) return;
    this.writeLog('verbose', message, optionalParams);
  }

  private writeLog(level: string, message: any, optionalParams: any[]): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context || optionalParams[0],
      message: typeof message === 'string' ? message : JSON.stringify(message),
      traceId: this.traceId,
      userId: this.userId,
    };

    if (optionalParams.length > 1) {
      entry.meta = optionalParams.slice(1).reduce((acc, param, index) => {
        acc[`param${index}`] = param;
        return acc;
      }, {});
    }

    // Extract error stack if present
    if (message instanceof Error) {
      entry.message = message.message;
      entry.meta = {
        ...entry.meta,
        stack: message.stack,
        name: message.name,
      };
    }

    if (this.isProduction) {
      // Structured JSON logging for production
      console.log(JSON.stringify(entry));
    } else {
      // Pretty logging for development
      const color = this.getColor(level);
      const reset = '\x1b[0m';
      const contextStr = entry.context ? `[${entry.context}]` : '';
      const traceStr = entry.traceId ? `[${entry.traceId.slice(0, 8)}]` : '';

      console.log(
        `${color}${entry.timestamp} ${level.toUpperCase().padEnd(7)} ${contextStr}${traceStr}${reset} ${entry.message}`,
      );

      if (entry.meta) {
        console.log('  Meta:', JSON.stringify(entry.meta, null, 2));
      }
    }
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[32m',    // Green
      debug: '\x1b[36m',   // Cyan
      verbose: '\x1b[35m', // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  // Audit logging methods
  audit(action: string, details: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'audit',
      context: 'AUDIT',
      message: action,
      meta: details,
      traceId: this.traceId,
      userId: this.userId,
    };

    console.log(JSON.stringify(entry));
  }

  // Performance logging
  performance(operation: string, durationMs: number, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'perf',
      context: 'PERFORMANCE',
      message: `${operation} completed in ${durationMs}ms`,
      meta: { ...meta, durationMs },
      traceId: this.traceId,
    };

    console.log(JSON.stringify(entry));
  }
}
