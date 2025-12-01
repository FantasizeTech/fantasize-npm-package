import type { Logger, LoggerEvent } from '../types';

export interface ElasticsearchSinkOptions {
  node: string; // http://localhost:9200
  index: string; // target index name
  auth?: { username: string; password: string } | { apiKey: string };
  flushIntervalMs?: number;
  maxBatch?: number;
  transform?: (e: LoggerEvent) => Record<string, unknown>;
}

interface PendingDoc {
  doc: Record<string, unknown>;
}

export function attachElasticsearchSink(
  logger: Logger,
  options: ElasticsearchSinkOptions
) {
  const {
    node,
    index,
    auth,
    flushIntervalMs = 3000,
    maxBatch = 200,
    transform = defaultTransform,
  } = options;

  let buffer: PendingDoc[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  function defaultTransform(e: LoggerEvent): Record<string, unknown> {
    return {
      '@timestamp': e.timestamp,
      level: e.level,
      message: e.message,
      service: e.service,
      context: e.context,
      extra: e.extra,
    };
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => flush(), flushIntervalMs);
  }

  async function getClient() {
    const mod = await import('@elastic/elasticsearch');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = new mod.Client({ node, auth: auth as any });
    return client;
  }

  async function flush() {
    if (!active) return;
    if (buffer.length === 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return;
    }
    const pending = buffer;
    buffer = [];
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    try {
      const client = await getClient();
      const body: Array<Record<string, unknown>> = [];
      for (const p of pending) {
        body.push({ index: { _index: index } });
        body.push(p.doc);
      }
      // dynamic bulk operations
      await (
        client as unknown as {
          bulk: (opts: {
            refresh: boolean;
            operations: Array<Record<string, unknown>>;
          }) => Promise<unknown>;
        }
      ).bulk({ refresh: false, operations: body });
    } catch (err) {
      logger.error(err as Error, { sink: 'elasticsearch-flush' });
    }
  }

  const unsubscribe = logger.subscribe((e) => {
    if (!active) return;
    buffer.push({ doc: transform(e) });
    if (buffer.length >= maxBatch) {
      flush();
    } else {
      schedule();
    }
  });

  return {
    flush,
    stop: () => {
      active = false;
      unsubscribe();
      if (timer) clearTimeout(timer);
    },
    unsubscribe,
  };
}
