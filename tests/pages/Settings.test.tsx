// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';

vi.mock('@/contexts/library-source-context', () => ({ useLibrarySource: vi.fn() }));
vi.mock('@/contexts/fs-access-context', () => ({ useFsAccessCtx: vi.fn() }));

import { Settings } from '@/pages/Settings';
import { useLibrarySource } from '@/contexts/library-source-context';
import { useFsAccessCtx } from '@/contexts/fs-access-context';

type LibrarySource = ReturnType<typeof useLibrarySource>;
type FsAccess = ReturnType<typeof useFsAccessCtx>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Settings page', () => {
  it('renders the heading and both settings sections', () => {
    vi.mocked(useLibrarySource).mockReturnValue({
      mode: 'local',
      refresh: async () => {},
      refreshing: false,
    } as LibrarySource);
    vi.mocked(useFsAccessCtx).mockReturnValue({
      supported: true,
      connected: false,
      reconnectNeeded: false,
      scanning: false,
      dirName: null,
      connect: vi.fn(),
      reconnect: vi.fn(),
      refresh: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as FsAccess);

    render(
      <ChakraProvider value={system}>
        <Settings />
      </ChakraProvider>,
    );

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Connect Folder')).toBeTruthy();
    expect(screen.getByText('Glass Effect')).toBeTruthy();
  });
});
