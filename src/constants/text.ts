export const APP_NAME = 'Aurora';

export const LIBRARY = 'Library';
export const ALBUMS = 'Albums';
export const SETTINGS = 'Settings';

export const NAV_ITEMS = [
  { label: LIBRARY, path: '/' },
  { label: ALBUMS, path: '/albums' },
] as const;

export const EMPTY_LIBRARY = 'No music yet — connect a folder in Settings';
export const EMPTY_LIBRARY_SERVER = 'No music found on the server';
export const NO_ALBUMS = 'No albums yet — add music first';
export const MUSIC_LIBRARY = 'Music Library';
export const ALL_ALBUMS = '← All Albums';
export const TRACK_COUNT = (n: number) => `${n} tracks`;
export const SEARCH_PLACEHOLDER = 'Search titles…';
export const EXPAND_SIDEBAR = 'Expand sidebar';
export const COLLAPSE_SIDEBAR = 'Collapse sidebar';
export const CLEAR_LIBRARY = 'Clear Library';
export const CONNECT_FOLDER = 'Connect Folder';
export const RECONNECT_FOLDER = 'Reconnect';
export const REFRESH_FOLDER = 'Refresh';
export const DISCONNECT_FOLDER = 'Disconnect';
export const SCANNING = 'Scanning…';
export const FOLDER_NOT_SUPPORTED = 'Folder access not supported in this browser. Use Chrome or Edge.';
export const SERVER_LIBRARY = 'Streaming from server';
export const RESCAN_LIBRARY = 'Rescan';
export const TRACKS_LOADED = (n: number) => `${n} track${n === 1 ? '' : 's'} loaded`;
export const GLASS_LABEL = 'Glass Effect';

export const PLAY = 'Play';
export const PAUSE = 'Pause';
export const PREVIOUS_TRACK = 'Previous track';
export const NEXT_TRACK = 'Next track';
export const SHUFFLE = 'Shuffle';
export const REPEAT = 'Repeat';
export const MUTE = 'Mute';
export const UNMUTE = 'Unmute';
export const VOLUME = 'Volume';
export const SEEK = 'Seek';
export const OPEN_NOW_PLAYING = 'Open now playing';
export const CLOSE_NOW_PLAYING = 'Close now playing';
