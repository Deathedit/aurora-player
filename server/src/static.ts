import path from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

export async function registerStatic(app: FastifyInstance, staticDir: string): Promise<void> {
  await app.register(fastifyStatic, { root: staticDir, wildcard: false });

  app.setNotFoundHandler((req, reply) => {
    const pathname = req.url.split('?')[0];
    const isClientRoute =
      req.method === 'GET' && !pathname.startsWith('/api') && path.extname(pathname) === '';
    return isClientRoute
      ? reply.sendFile('index.html')
      : reply.code(404).send({ error: 'not found' });
  });
}
