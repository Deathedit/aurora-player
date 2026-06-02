export const APP_NAME = 'Aurora';

export const LIBRARY = 'Library';
export const ALBUMS = 'Albums';
export const SETTINGS = 'Settings';

export const NAV_ITEMS = [
  { label: LIBRARY, path: '/' },
  { label: ALBUMS, path: '/albums' },
] as const;

export const EMPTY_LIBRARY = 'No music yet — connect a folder in Settings';
export const NO_ALBUMS = 'No albums yet — add music first';
export const MUSIC_LIBRARY = 'Music Library';
export const ALL_ALBUMS = '← All Albums';
export const TRACK_COUNT = (n: number) => `${n} tracks`;
export const EXPAND_SIDEBAR = 'Expand sidebar';
export const COLLAPSE_SIDEBAR = 'Collapse sidebar';
export const CLEAR_LIBRARY = 'Clear Library';
export const CONNECT_FOLDER = 'Connect Folder';
export const RECONNECT_FOLDER = 'Reconnect';
export const REFRESH_FOLDER = 'Refresh';
export const DISCONNECT_FOLDER = 'Disconnect';
export const SCANNING = 'Scanning…';
export const FOLDER_NOT_SUPPORTED = 'Folder access not supported in this browser. Use Chrome or Edge.';
export const TRACKS_LOADED = (n: number) => `${n} track${n === 1 ? '' : 's'} loaded`;
export const GLASS_LABEL = 'Glass Effect';
