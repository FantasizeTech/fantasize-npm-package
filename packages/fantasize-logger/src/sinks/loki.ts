import type { Logger, LoggerEvent } from '../types';

export interface LokiSinkOptions {
  endpoint: string; // e.g. https://loki.example.com/loki/api/v1/push
  labels?: Record<string, string>; // additional Loki labels
  batchIntervalMs?: number; // flush interval
  maxBatch?: number; // flush when size reached
  transform?: (e: LoggerEvent) => string; // custom line formatter
  fetchImpl?: typeof fetch; // override fetch (tests)
}

interface PendingEvent {
  ts: number;
  line: string;
}

export function attachLokiSink(logger: Logger, options: LokiSinkOptions) {
  const {
    endpoint,
    labels = {},
    batchIntervalMs = 2000,
    maxBatch = 100,
    transform = defaultTransform,
    fetchImpl = globalThis.fetch,
  } = options;

  let buffer: PendingEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      flush();
    }, batchIntervalMs);
  }

  function toNano(ts: number): string {
    return (ts * 1_000_000).toString(); // ms -> ns
  }

  function defaultTransform(e: LoggerEvent): string {
    return JSON.stringify({
      t: e.timestamp,
      lvl: e.level,
      msg: e.message,
      svc: e.service,
      ctx: e.context,
      extra: e.extra,
    });
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

    const stream = {
      stream: { ...labels },
      values: pending.map((p) => [toNano(p.ts), p.line]),
    };

    try {
      await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streams: [stream] }),
      });
    } catch (err) {
      // swallow errors; optionally could re-log locally
      logger.error(err as Error, { sink: 'loki' });
    }
  }

  const unsubscribe = logger.subscribe((e) => {
    if (!active) return;
    buffer.push({ ts: Date.now(), line: transform(e) });
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
