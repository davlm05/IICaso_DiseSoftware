/** Minimal structured logger + per-feature transcript capture. */
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
};
const RESET = '\x1b[0m';

export class Logger {
  private buffer: string[] = [];

  constructor(private readonly scope: string = 'aidev') {}

  log(level: LogLevel, msg: string): void {
    const line = `[${level.toUpperCase()}] ${this.scope}: ${msg}`;
    this.buffer.push(line);
    const color = COLORS[level] ?? '';
    // eslint-disable-next-line no-console
    console.log(`${color}${line}${RESET}`);
  }

  info(msg: string): void {
    this.log('info', msg);
  }
  warn(msg: string): void {
    this.log('warn', msg);
  }
  error(msg: string): void {
    this.log('error', msg);
  }
  debug(msg: string): void {
    if (process.env.AIDEV_DEBUG === '1') this.log('debug', msg);
  }

  /** Persist the buffered log to a feature's workspace for traceability. */
  flushTo(file: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, this.buffer.join('\n') + '\n', 'utf8');
    this.buffer = [];
  }
}
