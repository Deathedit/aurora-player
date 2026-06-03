import fs from 'node:fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { PORT, STATIC_DIR, MUSIC_DIR, DB_PATH } from './config.js';
import { registerApi } from './routes.js';
import { scanLibrary } from './scan.js';

const app = Fastify({ logger: true });

registerApi(app);

if (fs.existsSync(STATIC_DIR)) {
  await app.register(fastifyStatic, { root: STATIC_DIR });
} else {
  app.log.warn(`STATIC_DIR ${STATIC_DIR} not found — serving API only`);
}

app.log.info(`music dir: ${MUSIC_DIR}`);
app.log.info(`db path: ${DB_PATH}`);

void scanLibrary().then(() => app.log.info('initial scan complete'));

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
