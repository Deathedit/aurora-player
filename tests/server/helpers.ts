import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createTmpEnv(prefix = 'aurora-test-') {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const musicDir = path.join(tmpRoot, 'music');
  process.env.MUSIC_DIR = musicDir;
  process.env.DB_PATH = path.join(tmpRoot, 'aurora.db');
  return {
    tmpRoot,
    musicDir,
    cleanup: () => fs.rmSync(tmpRoot, { recursive: true, force: true }),
  };
}
