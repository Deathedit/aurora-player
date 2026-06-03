import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createTmpEnv } from './helpers';

type App = Awaited<ReturnType<typeof import('@server/app').buildApp>>;

let app: App;
let cleanup: () => void;

const INDEX_HTML = '<!doctype html><title>Aurora</title><div id="root"></div>';

beforeAll(async () => {
  const env = createTmpEnv('aurora-static-');
  cleanup = env.cleanup;
  const publicDir = path.join(env.tmpRoot, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'index.html'), INDEX_HTML);
  fs.writeFileSync(path.join(publicDir, 'app.js'), 'console.log(1)');

  const { buildApp } = await import('@server/app');
  const { registerStatic } = await import('@server/static');
  app = buildApp();
  await registerStatic(app, publicDir);
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  cleanup?.();
});

describe('SPA fallback', () => {
  it('serves index.html at the root', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(INDEX_HTML);
  });

  it('serves index.html for an extension-less client route', async () => {
    const res = await app.inject({ method: 'GET', url: '/albums' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(INDEX_HTML);
  });

  it('serves a real static asset that exists', async () => {
    const res = await app.inject({ method: 'GET', url: '/app.js' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('console.log(1)');
  });

  it('404s a missing asset (has an extension) instead of the app shell', async () => {
    const res = await app.inject({ method: 'GET', url: '/assets/missing.js' });
    expect(res.statusCode).toBe(404);
    expect(res.body).not.toBe(INDEX_HTML);
  });

  it('404s an unmatched /api path as JSON', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'not found' });
  });
});
