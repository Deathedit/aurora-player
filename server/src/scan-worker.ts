import { parentPort } from 'node:worker_threads';
import { scanLibrary } from './scan.js';
import type { ScanMessage } from './scanner.js';

const post = (msg: ScanMessage) => parentPort?.postMessage(msg);

scanLibrary()
  .then(() => post({ type: 'done' }))
  .catch((err: unknown) => post({ type: 'error', message: String(err) }));
