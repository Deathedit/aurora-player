import fs from 'node:fs';
import fastifyStatic from '@fastify/static';
import { PORT, STATIC_DIR, MUSIC_DIR, DB_PATH } from './config.js';
import { buildApp } from './app.js';
import { startScan } from './scanner.js';
import { closeDb } from './db.js';

const app = buildApp({ logger: true });

if (fs.existsSync(STATIC_DIR)) {
  await app.register(fastifyStatic, { root: STATIC_DIR });
} else {
  app.log.warn(`STATIC_DIR ${STATIC_DIR} not found — serving API only`);
}

app.log.info(`music dir: ${MUSIC_DIR}`);
app.log.info(`db path: ${DB_PATH}`);

startScan({ info: (m) => app.log.info(m), error: (m) => app.log.error(m) });

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received — shutting down`);
    await app.close();
    closeDb();
    process.exit(0);
  });
}

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
