export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  context?: Record<string, any>;
  extra?: Record<string, any>;
}

export interface LoggerEvent extends LogMetadata {}

export interface LoggerOptions {
  service?: string;
  context?: Record<string, any>;
  level?: LogLevel; // minimum level to emit
  color?: boolean; // force enable/disable color
  metadataProvider?: () => Record<string, any>;
  enableDebug?: boolean; // overrides NODE_ENV check
}

export interface Logger {
  debug: (
    message: string,
    extra?: Record<string, any>
  ) => LoggerEvent | undefined;
  info: (
    message: string,
    extra?: Record<string, any>
  ) => LoggerEvent | undefined;
  warn: (
    message: string,
    extra?: Record<string, any>
  ) => LoggerEvent | undefined;
  error: (
    message: string | Error,
    extra?: Record<string, any>
  ) => LoggerEvent | undefined;
  child: (opts: Partial<LoggerOptions>) => Logger;
  level: () => LogLevel;
  subscribe: (listener: (event: LoggerEvent) => void) => () => void;
}
