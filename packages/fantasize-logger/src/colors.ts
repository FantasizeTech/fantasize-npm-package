const ANSI: Record<string, string> = {
  reset: '\u001b[0m',
  dim: '\u001b[2m',
  debug: '\u001b[36m', // cyan
  info: '\u001b[32m', // green
  warn: '\u001b[33m', // yellow
  error: '\u001b[31m', // red
};

export const colorizeNode = (
  level: string,
  text: string,
  useColor: boolean
) => {
  if (!useColor) return text;
  const code = ANSI[level] || '';
  return code + text + ANSI.reset;
};

export const browserStyleFor = (level: string): string => {
  switch (level) {
    case 'debug':
      return 'color: #06b6d4;';
    case 'info':
      return 'color: #16a34a;';
    case 'warn':
      return 'color: #ca8a04;';
    case 'error':
      return 'color: #dc2626;';
    default:
      return '';
  }
};
