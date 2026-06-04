// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';

vi.mock('@/contexts/library-source-context', () => ({ useLibrarySource: vi.fn() }));
vi.mock('@/contexts/fs-access-context', () => ({ useFsAccessCtx: vi.fn() }));

import { LibrarySection } from '@/components/settings/LibrarySection';
import { useLibrarySource } from '@/contexts/library-source-context';
import { useFsAccessCtx } from '@/contexts/fs-access-context';

type LibrarySource = ReturnType<typeof useLibrarySource>;
type FsAccess = ReturnType<typeof useFsAccessCtx>;

const fsState = (over: Partial<FsAccess> = {}): FsAccess =>
  ({
    supported: true,
    connected: false,
    reconnectNeeded: false,
    scanning: false,
    dirName: null,
    connect: vi.fn(),
    reconnect: vi.fn(),
    refresh: vi.fn(),
    disconnect: vi.fn(),
    ...over,
  }) as unknown as FsAccess;

const renderUI = (ui: ReactElement) => render(<ChakraProvider value={system}>{ui}</ChakraProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LibrarySection — backend mode', () => {
  it('renders the server badge and triggers a rescan', () => {
    const refresh = vi.fn();
    vi.mocked(useLibrarySource).mockReturnValue({ mode: 'backend', refresh, refreshing: false } as LibrarySource);
    renderUI(<LibrarySection />);

    expect(screen.getByText('Streaming from server')).toBeTruthy();
    fireEvent.click(screen.getByText('Rescan'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('disables the rescan button while refreshing', () => {
    vi.mocked(useLibrarySource).mockReturnValue({
      mode: 'backend',
      refresh: vi.fn(),
      refreshing: true,
    } as LibrarySource);
    renderUI(<LibrarySection />);
    expect((screen.getByText('Rescan').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('LibrarySection — local mode', () => {
  beforeEach(() => {
    vi.mocked(useLibrarySource).mockReturnValue({
      mode: 'local',
      refresh: async () => {},
      refreshing: false,
    } as LibrarySource);
  });

  it('shows the unsupported message when the API is missing', () => {
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ supported: false }));
    renderUI(<LibrarySection />);
    expect(screen.getByText(/not supported/i)).toBeTruthy();
  });

  it('offers a connect button when disconnected', () => {
    const connect = vi.fn();
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ connect }));
    renderUI(<LibrarySection />);
    fireEvent.click(screen.getByText('Connect Folder'));
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('shows a scanning state when a scan is underway', () => {
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ scanning: true }));
    renderUI(<LibrarySection />);
    expect(screen.getByText('Scanning…')).toBeTruthy();
  });

  it('offers reconnect when permission was lost', () => {
    const reconnect = vi.fn();
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ reconnectNeeded: true, reconnect }));
    renderUI(<LibrarySection />);
    fireEvent.click(screen.getByText('Reconnect'));
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it('shows the folder name with refresh and disconnect when connected', () => {
    const refresh = vi.fn();
    const disconnect = vi.fn();
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ connected: true, dirName: 'Music', refresh, disconnect }));
    renderUI(<LibrarySection />);

    expect(screen.getByText('Music')).toBeTruthy();
    fireEvent.click(screen.getByText('Refresh'));
    fireEvent.click(screen.getByText('Disconnect'));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('disables refresh and spins the folder loader while scanning when connected', () => {
    vi.mocked(useFsAccessCtx).mockReturnValue(fsState({ connected: true, dirName: 'Music', scanning: true }));
    renderUI(<LibrarySection />);
    expect((screen.getByText('Refresh').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
