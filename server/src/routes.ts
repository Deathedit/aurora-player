import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { FastifyInstance } from 'fastify';
import { iterateTracks, getTrackPath, getArt } from './db.js';
import { MUSIC_DIR } from './config.js';
import { startScan, isScanning } from './scanner.js';

const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma',
  '.webm': 'audio/webm',
};

function audioMime(file: string): string {
  return AUDIO_MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}

export function registerApi(app: FastifyInstance): void {
  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/tracks', async (_req, reply) => {
    const iter = iterateTracks();
    const stream = new Readable({
      read() {
        try {
          for (let n = 0; n < 100; n++) {
            const { value, done } = iter.next();
            if (done) {
              this.push(null);
              return;
            }
            if (!this.push(JSON.stringify(value) + '\n')) return;
          }
        } catch (err) {
          this.destroy(err as Error);
        }
      },
      destroy(err, cb) {
        iter.return?.();
        cb(err);
      },
    });
    return reply.type('application/x-ndjson').send(stream);
  });

  app.post('/api/rescan', async () => {
    startScan({ info: (m) => app.log.info(m), error: (m) => app.log.error(m) });
    return { ok: true };
  });

  app.get('/api/scanning', async () => ({ scanning: isScanning() }));

  app.get<{ Params: { hash: string } }>('/api/art/:hash', async (req, reply) => {
    const art = getArt(req.params.hash);
    if (!art) return reply.code(404).send({ error: 'not found' });
    return reply
      .header('Content-Type', art.type)
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .send(art.data);
  });

  app.get<{ Params: { id: string } }>('/api/stream/:id', async (req, reply) => {
    const filePath = getTrackPath(decodeURIComponent(req.params.id));
    if (!filePath) return reply.code(404).send({ error: 'not found' });

    const resolved = path.resolve(filePath);
    if (resolved !== MUSIC_DIR && !resolved.startsWith(MUSIC_DIR + path.sep)) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    let size: number;
    try {
      size = (await fsp.stat(resolved)).size;
    } catch {
      return reply.code(404).send({ error: 'not found' });
    }

    const type = audioMime(resolved);
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        let start: number;
        let end: number;
        if (match[1]) {
          start = parseInt(match[1], 10);
          end = match[2] ? parseInt(match[2], 10) : size - 1;
        } else {
          start = Math.max(0, size - parseInt(match[2], 10));
          end = size - 1;
        }
        if (start >= size || end >= size || start > end) {
          return reply.code(416).header('Content-Range', `bytes */${size}`).send();
        }
        return reply
          .code(206)
          .header('Content-Type', type)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Range', `bytes ${start}-${end}/${size}`)
          .header('Content-Length', end - start + 1)
          .send(fs.createReadStream(resolved, { start, end }));
      }
    }

    return reply
      .header('Content-Type', type)
      .header('Accept-Ranges', 'bytes')
      .header('Content-Length', size)
      .send(fs.createReadStream(resolved));
  });
}
