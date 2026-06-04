// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, render } from '@testing-library/react';

const H = vi.hoisted(() => ({ initOnMount: vi.fn() }));

vi.mock('@/hooks/useFsAccess', () => ({
  useFsAccess: () => ({
    connected: false,
    dirName: null,
    scanning: false,
    reconnectNeeded: false,
    supported: true,
    connect: vi.fn(),
    reconnect: vi.fn(),
    refresh: vi.fn(),
    disconnect: vi.fn(),
    initOnMount: H.initOnMount,
  }),
}));

vi.mock('@/contexts/player-context', () => ({
  usePlayer: () => ({ addFiles: vi.fn(), clearLibrary: vi.fn() }),
  PlayerCtx: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

import { FsAccessProvider } from '@/components/FsAccessProvider';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FsAccessProvider', () => {
  it('runs the mount initializer exactly once, even under StrictMode', () => {
    render(
      <StrictMode>
        <FsAccessProvider>
          <div>child</div>
        </FsAccessProvider>
      </StrictMode>,
    );
    expect(H.initOnMount).toHaveBeenCalledTimes(1);
  });
});
