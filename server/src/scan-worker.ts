import { parentPort } from 'node:worker_threads';
import { scanLibrary } from './scan.js';

scanLibrary()
  .then(() => parentPort?.postMessage({ type: 'done' }))
  .catch((err: unknown) => parentPort?.postMessage({ type: 'error', message: String(err) }));
