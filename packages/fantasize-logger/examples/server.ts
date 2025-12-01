// Node.js server usage example
import { createServer } from 'node:http';
import { createLogger, attachLokiSink } from '../src/index';

const logger = createLogger({
  service: 'http-server',
  context: { env: process.env.NODE_ENV },
});

// Optional: attach Loki sink (requires endpoint)
// Comment out if not using Loki
const loki = attachLokiSink(logger, {
  endpoint: 'https://loki.example.com/loki/api/v1/push',
  labels: { app: 'http-server' },
  batchIntervalMs: 1500,
});

const server = createServer((req, res) => {
  const reqLog = logger.child({
    context: { method: req.method, url: req.url },
  });
  reqLog.info('Request received');
  if (req.url === '/error') {
    try {
      throw new Error('Boom test');
    } catch (err) {
      reqLog.error(err as Error);
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

server.listen(3000, () => {
  logger.info('Server listening', { port: 3000 });
});

// Graceful shutdown
function shutdown() {
  logger.warn('Shutting down');
  loki.flush().finally(() => {
    loki.stop();
    server.close(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
