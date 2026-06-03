import { Worker } from 'node:worker_threads';
import { scanLibrary } from './scan.js';

type Logger = { info: (msg: string) => void; error: (msg: string) => void };

let scanning = false;

export function isScanning(): boolean {
  return scanning;
}

function workerUrl(): URL {
  const ext = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  return new URL(`./scan-worker.${ext}`, import.meta.url);
}

export function startScan(log?: Logger): void {
  if (scanning) return;
  scanning = true;
  log?.info('scan started');

  let settled = false;
  const finish = (msg: string, isError = false) => {
    if (settled) return;
    settled = true;
    scanning = false;
    if (isError) log?.error(msg);
    else log?.info(msg);
  };

  const inlineFallback = (reason: string) => {
    if (settled) return;
    log?.error(reason);
    scanLibrary()
      .then(() => finish('scan complete (inline)'))
      .catch((e: unknown) => finish(`scan failed (inline): ${String(e)}`, true));
  };

  let worker: Worker;
  try {
    worker = new Worker(workerUrl());
  } catch (err) {
    inlineFallback(`worker spawn failed, scanning inline: ${String(err)}`);
    return;
  }

  worker.on('message', (m: { type: string; message?: string }) => {
    if (m.type === 'done') finish('scan complete');
    else if (m.type === 'error') finish(`scan failed: ${m.message}`, true);
  });
  worker.on('error', (err) => inlineFallback(`worker error, scanning inline: ${String(err)}`));
  worker.on('exit', () => finish('scan worker exited unexpectedly', true));
}
