/**
 * Small logger that no-ops debug/info in production to reduce log volume.
 * - debug / info: only when NODE_ENV !== 'production' or DEBUG=true
 * - warn / error: always logged
 */
const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
const isDebug =
  !isProduction ||
  (typeof process !== 'undefined' && process.env?.DEBUG === 'true');

function noop() {}

function log(...args: unknown[]) {
  console.log(...args);
}

function warn(...args: unknown[]) {
  console.warn(...args);
}

function error(...args: unknown[]) {
  console.error(...args);
}

export const logger = {
  /** Debug/trace – dev only (or DEBUG=true in production) */
  debug: isDebug ? log : noop,
  /** Informational – dev only (or DEBUG=true in production) */
  info: isDebug ? log : noop,
  /** Warnings – always logged */
  warn,
  /** Errors – always logged */
  error,
};
