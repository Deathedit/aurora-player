export const APP_NAME = 'Aurora';

export const NAV_ITEMS = [
  { label: 'Library', path: '/' },
  { label: 'Albums', path: '/albums' },
] as const;

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const EMPTY_LIBRARY = 'No music yet — connect a folder in Settings';
export const NO_ALBUMS = 'No albums yet — add music first';
export const CLEAR_LIBRARY = 'Clear Library';
export const CONNECT_FOLDER = 'Connect Folder';
export const RECONNECT_FOLDER = 'Reconnect';
export const REFRESH_FOLDER = 'Refresh';
export const DISCONNECT_FOLDER = 'Disconnect';
export const SCANNING = 'Scanning…';
export const FOLDER_NOT_SUPPORTED =
  'Folder access not supported in this browser. Use Chrome or Edge.';
export const TRACKS_LOADED = (n: number) =>
  `${n} track${n === 1 ? '' : 's'} loaded`;
export const THEME_LABEL = 'Theme';
export const GLASS_LABEL = 'Glass Effect';
export const DARK = 'dark';
export const SPOTIFY = 'spotify';
