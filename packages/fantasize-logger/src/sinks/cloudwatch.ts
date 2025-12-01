import type { Logger, LoggerEvent } from '../types';

export interface CloudWatchSinkOptions {
  logGroupName: string;
  logStreamName: string;
  region?: string;
  createIfMissing?: boolean;
  flushIntervalMs?: number;
  maxBatch?: number; // AWS limit per PutLogEvents is 10,000 events and 1MB; we keep small
  transform?: (e: LoggerEvent) => string;
}

interface PendingEvent {
  ts: number;
  line: string;
}

// Lazy load AWS client to avoid forcing dependency for non-users
async function loadClient(region?: string) {
  const mod = await import('@aws-sdk/client-cloudwatch-logs');
  const {
    CloudWatchLogsClient,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    DescribeLogStreamsCommand,
    PutLogEventsCommand,
  } = mod;
  const client = new CloudWatchLogsClient({ region });
  return {
    client,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    DescribeLogStreamsCommand,
    PutLogEventsCommand,
  };
}

export function attachCloudWatchSink(
  logger: Logger,
  options: CloudWatchSinkOptions
) {
  const {
    logGroupName,
    logStreamName,
    region,
    createIfMissing = true,
    flushIntervalMs = 5000,
    maxBatch = 100,
    transform = defaultTransform,
  } = options;

  let sequenceToken: string | undefined;
  let buffer: PendingEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = true;
  let initializing = false;

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

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => flush(), flushIntervalMs);
  }

  async function ensureStream() {
    if (initializing) return;
    initializing = true;
    try {
      const aws = await loadClient(region);
      // Describe log streams
      const desc = await aws.client.send(
        new aws.DescribeLogStreamsCommand({
          logGroupName,
          logStreamNamePrefix: logStreamName,
        })
      );
      const found = desc.logStreams?.find(
        (s: { logStreamName?: string; uploadSequenceToken?: string }) =>
          s.logStreamName === logStreamName
      );
      if (!found && createIfMissing) {
        // create group if needed
        try {
          await aws.client.send(
            new aws.CreateLogGroupCommand({ logGroupName })
          );
        } catch {
          // ignore if already exists
        }
        await aws.client.send(
          new aws.CreateLogStreamCommand({ logGroupName, logStreamName })
        );
      } else if (found) {
        sequenceToken = found.uploadSequenceToken;
      }
    } catch (err) {
      logger.error(err as Error, { sink: 'cloudwatch-init' });
    } finally {
      initializing = false;
    }
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
    const events = buffer;
    buffer = [];
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    try {
      await ensureStream();
      const aws = await loadClient(region);
      const putEvents = events.map((e) => ({
        timestamp: e.ts,
        message: e.line,
      }));
      const resp = await aws.client.send(
        new aws.PutLogEventsCommand({
          logGroupName,
          logStreamName,
          logEvents: putEvents,
          sequenceToken,
        })
      );
      sequenceToken = resp.nextSequenceToken;
    } catch (err) {
      logger.error(err as Error, { sink: 'cloudwatch-flush' });
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
