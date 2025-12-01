import { LogLevel, Logger, LoggerEvent, LoggerOptions } from './types';
import { colorizeNode, browserStyleFor } from './colors';

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const isNode = typeof process !== 'undefined' && !!process.versions?.node;
const nodeEnv: string | undefined = isNode
  ? process.env.NODE_ENV
  : (globalThis as { NODE_ENV?: string }).NODE_ENV;
const isDev = nodeEnv !== 'production';

function shouldEmit(min: LogLevel, level: LogLevel): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(min);
}

function normalizeErrorMessage(msg: string | Error): {
  message: string;
  extra?: Record<string, unknown>;
} {
  if (msg instanceof Error) {
    return {
      message: msg.message,
      extra: { name: msg.name, stack: msg.stack },
    };
  }
  return { message: msg };
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const listeners = new Set<(e: LoggerEvent) => void>();
  const base: LoggerOptions = {
    level: options.level || 'debug',
    service: options.service,
    context: options.context || {},
    metadataProvider: options.metadataProvider,
    color: options.color ?? isDev,
    enableDebug: options.enableDebug ?? isDev,
  };

  function emit(
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ): LoggerEvent | undefined {
    if (level === 'debug' && !base.enableDebug) return undefined;
    const currentLevel = base.level ?? 'debug';
    if (!shouldEmit(currentLevel, level)) return undefined;

    const metaExtra = base.metadataProvider ? base.metadataProvider() : {};
    const event: LoggerEvent = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: base.service,
      context: base.context,
      extra: { ...metaExtra, ...extra },
    };

    output(event);
    listeners.forEach((l) => l(event));
    return event;
  }

  function output(e: LoggerEvent) {
    const { level, message, service } = e;
    const metaStr = JSON.stringify({ service, ...e.context, ...e.extra });
    if (isNode) {
      const line = `${e.timestamp} ${level.toUpperCase()}${
        service ? ' [' + service + ']' : ''
      } ${message} ${metaStr}`;
      switch (level) {
        case 'debug':
          console.debug(colorizeNode(level, line, !!base.color));
          break;
        case 'info':
          console.info(colorizeNode(level, line, !!base.color));
          break;
        case 'warn':
          console.warn(colorizeNode(level, line, !!base.color));
          break;
        case 'error':
          console.error(colorizeNode(level, line, !!base.color));
          break;
      }
    } else {
      const style = base.color ? browserStyleFor(level) : '';
      const prefix = `%c${level.toUpperCase()}${
        service ? ' [' + service + ']' : ''
      }`;
      const body = `${message}`;
      const tail = metaStr;
      switch (level) {
        case 'debug':
          console.debug(prefix, style, body, tail);
          break;
        case 'info':
          console.info(prefix, style, body, tail);
          break;
        case 'warn':
          console.warn(prefix, style, body, tail);
          break;
        case 'error':
          console.error(prefix, style, body, tail);
          break;
      }
    }
  }

  const api: Logger = {
    debug: (msg, extra) => emit('debug', msg, extra),
    info: (msg, extra) => emit('info', msg, extra),
    warn: (msg, extra) => emit('warn', msg, extra),
    error: (msg, extra) => {
      const norm = normalizeErrorMessage(msg);
      return emit('error', norm.message, { ...norm.extra, ...extra });
    },
    child: (opts) =>
      createLogger({
        ...base,
        ...opts,
        context: { ...base.context, ...opts.context },
      }),
    level: () => base.level ?? 'debug',
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return api;
}
