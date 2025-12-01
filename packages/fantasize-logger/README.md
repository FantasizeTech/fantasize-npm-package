# @fantasizetech/fantasize-logger

> Lightweight universal logger for both frontend and backend. Replaces scattered `console.log` usage with structured log events: levels (`info`, `warn`, `error`, `debug`), automatic metadata, colors in development, and plain output in production.

## Features

- Universal: Works in Node.js and the browser
- Levels: `debug`, `info`, `warn`, `error` (debug auto-disabled in production unless forced)
- Metadata: timestamp, level, service, context, extra (combines provider + call-time data)
- Dev coloring: ANSI colors (Node) / `%c` styles (browser) only when not in production by default
- Structured events: Easy to forward to log aggregators / APM / remote collectors
- Child logger: Derive contextual child loggers without losing parent metadata
- Subscription API: Stream log events to custom sinks or telemetry pipelines
- Built-in sinks: Loki, AWS CloudWatch Logs, Elasticsearch (optional deps)

## Install

```bash
npm install @fantasizetech/fantasize-logger
```

## Quick Start

```ts
import { createLogger } from '@fantasizetech/fantasize-logger';

const logger = createLogger({ service: 'api', context: { version: '1' } });

logger.info('Server started');
logger.warn('Cache miss', { key: 'user:123' });
logger.error(new Error('Boom'));
logger.debug('Detailed diagnostic', { payloadSize: 2048 }); // hidden in production by default
```

## Client (Browser) Example

```ts
import { createLogger } from '@fantasizetech/fantasize-logger';

const logger = createLogger({ service: 'web-ui', context: { appVersion: '1.0.0' } });
logger.info('App boot');
logger.debug('Dashboard mounted'); // hidden in production

// Global error capture
window.addEventListener('error', (evt) => {
  logger.error(evt.error || evt.message);
});

// Child logger per action
function track(action: string) {
  logger.child({ context: { action } }).info('User action');
}
```

## Server (Node.js) Example

```ts
import { createServer } from 'node:http';
import { createLogger } from '@fantasizetech/fantasize-logger';

const logger = createLogger({ service: 'http-server', context: { env: process.env.NODE_ENV } });

const server = createServer((req, res) => {
  const reqLog = logger.child({ context: { method: req.method, url: req.url } });
  reqLog.info('Request received');
  try {
    if (req.url === '/error') throw new Error('Boom');
  } catch (err) {
    reqLog.error(err as Error);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

server.listen(3000, () => logger.info('Listening', { port: 3000 }));
```

## Options

```ts
interface LoggerOptions {
  service?: string; // Service / module name tag
  context?: Record<string, unknown>; // Base context merged into every event
  level?: 'debug' | 'info' | 'warn' | 'error'; // Minimum level emitted
  color?: boolean; // Force enable/disable color (default: dev only)
  metadataProvider?: () => Record<string, unknown>; // Dynamic metadata supplier per event
  enableDebug?: boolean; // Force allow debug even in production
}
```

## Child Logger

```ts
const reqLogger = logger.child({ context: { requestId: 'abc123' } });
reqLogger.info('Request received');
```

## Subscribe (Custom Sink)

## Built-in Sinks

```ts
import { createLogger, attachLokiSink, attachCloudWatchSink, attachElasticsearchSink } from '@fantasizetech/fantasize-logger';

const logger = createLogger({ service: 'payments' });

// Loki
const loki = attachLokiSink(logger, { endpoint: 'https://loki.example.com/loki/api/v1/push', labels: { app: 'payments' } });

// CloudWatch (ensure optional dependency installed and AWS creds env configured)
const cw = attachCloudWatchSink(logger, { logGroupName: '/app/payments', logStreamName: 'main', region: 'us-east-1' });

// Elasticsearch
const es = attachElasticsearchSink(logger, { node: 'http://localhost:9200', index: 'payments-logs' });

logger.info('Started');

// On shutdown
await loki.flush();
await cw.flush();
await es.flush();
loki.stop();
cw.stop();
es.stop();
```

Install optional dependencies when needed:

```bash
npm install @aws-sdk/client-cloudwatch-logs @elastic/elasticsearch
```

Each sink batches events for efficiency. Call `flush()` before process exit to minimize loss.

```ts
const unsubscribe = logger.subscribe((evt) => {
  // Forward evt to an external system, e.g. fetch('/collect', { method: 'POST', body: JSON.stringify(evt) })
});
```

## Browser Usage

Ships as plain TypeScript/ES modules; browser bundlers can consume it directly. Uses `%c` to style console output when color is enabled.

## Production Behavior

- `debug` level suppressed when `NODE_ENV === 'production'` unless `enableDebug: true`
- Colors disabled in production unless explicitly enabled via `color: true`

## Error Logging

```ts
try {
  doDangerous();
} catch (err) {
  logger.error(err); // Extracts name + stack automatically
}
```

## Structured Event Shape

```json
{
  "timestamp": "2025-12-01T12:00:00.000Z",
  "level": "info",
  "message": "Server started",
  "service": "api",
  "context": { "version": "1" },
  "extra": { "port": 3000 }
}
```

## License

MIT
