export { createLogger } from './logger';
export type { Logger, LoggerEvent, LoggerOptions, LogLevel } from './types';
export { attachLokiSink } from './sinks/loki';
export { attachCloudWatchSink } from './sinks/cloudwatch';
export { attachElasticsearchSink } from './sinks/elasticsearch';
