// Browser/Frontend usage example
// Bundle this file with your frontend build tool (Vite/Webpack/etc.)
import { createLogger } from '../src/logger';

// In a SPA, you might create a shared logger instance
const logger = createLogger({
  service: 'web-ui',
  context: { appVersion: '1.0.0' },
});

// Basic events
logger.info('App boot');
logger.warn('Slow network detected', { rttMs: 380 });

// Debug (hidden in production unless enableDebug: true)
logger.debug('Component mounted', { component: 'Dashboard' });

// Error handling example
window.addEventListener('error', (evt) => {
  logger.error(evt.error || evt.message);
});

// Child logger with request/interaction context
export function trackUserAction(action: string) {
  const actionLogger = logger.child({ context: { action } });
  actionLogger.info('User action');
}

// Example sink subscription (forward to backend collector)
const unsubscribe = logger.subscribe((evt) => {
  // Fire-and-forget send (replace with fetch if needed)
  navigator.sendBeacon?.('/log-collect', JSON.stringify(evt));
});

// Cleanup example (call when unloading SPA)
export function shutdown() {
  unsubscribe();
}
