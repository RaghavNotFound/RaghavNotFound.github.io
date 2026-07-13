// App Configuration and Controls

// 1. Music Playlist
export const PLAYLIST = [
  '/music/C418 - Beginning 2.mp3',
  '/music/C418 - Floating Trees.mp3',
  '/music/C418 - Moog City 2.mp3',
  '/music/C418 - Mutation.mp3'
];

// 2. Music Notification Settings
export const KEEP_MUSIC_NOTIFICATION_ALWAYS_ACTIVE = false;
export const MUSIC_TOAST_WIDTH = 'fit-content'; // Adapts exactly to text width
export const MUSIC_TOAST_HEIGHT = 'calc(90px)'; // You can change this to '100px', etc.
export const MUSIC_TOAST_BORDER_WIDTH = 'calc(2 * var(--mu))'; // Change to '5px', etc.
export const MUSIC_TOAST_BORDER_RADIUS = '10px'; // Change to '10px' for rounded corners
export const MUSIC_TOAST_X = 'calc(0 * var(--mu))'; // Distance from the left edge
export const MUSIC_TOAST_Y = 'calc(0 * var(--mu))'; // Distance from the top edge
export const MUSIC_TOAST_ICON_SIZE = 'calc(8 * var(--font-mu))'; // Size of the music note icons
export const MUSIC_TOAST_ICON_MARGIN = 'calc(-3.5 * var(--font-mu))'; // Spacing between icons (use negative for overlap)
export const MUSIC_TOAST_BOUNCE_SPEED = '0.5s'; // Speed of the up and down bounce animation
export const MUSIC_TOAST_BOUNCE_DELAY = '0.1s'; // Delay between each icon's bounce