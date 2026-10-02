// Generated from fridgechef-mockup/js/icons.js (24px grid, 1.75 default stroke).
// Shapes are stroked with the icon colour; `filled` shapes are also filled with it.
// `play` is deliberately left out: the content rules forbid play-button icons.

export type IconShape =
  | { type: 'path'; d: string; filled?: boolean }
  | { type: 'circle'; cx: number; cy: number; r: number; filled?: boolean }
  | {
      type: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      filled?: boolean;
    };

export const iconShapes = {
  back: [{ type: 'path', d: 'M19 12H5M11 6l-6 6 6 6' }],
  search: [
    { type: 'circle', cx: 11, cy: 11, r: 7 },
    { type: 'path', d: 'M20 20l-3.5-3.5' },
  ],
  bell: [
    { type: 'path', d: 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z' },
    { type: 'path', d: 'M10 20.5a2 2 0 0 0 4 0' },
  ],
  camera: [
    { type: 'path', d: 'M4 8h3l2-3h6l2 3h3v11H4z' },
    { type: 'circle', cx: 12, cy: 13, r: 3.5 },
  ],
  gallery: [
    { type: 'rect', x: 3.5, y: 4.5, width: 17, height: 15, rx: 3 },
    { type: 'circle', cx: 9, cy: 10, r: 1.6 },
    { type: 'path', d: 'M20.5 16l-5-5-8 8.5' },
  ],
  home: [{ type: 'path', d: 'M4 11l8-6.5 8 6.5V20h-5v-5h-6v5H4z' }],
  pantry: [
    {
      type: 'path',
      d: 'M8 3.5h8M7.5 6.5h9v1.8a2 2 0 0 1 1.5 1.9V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19v-8.8a2 2 0 0 1 1.5-1.9z',
    },
    { type: 'path', d: 'M6 13h12' },
  ],
  heart: [
    {
      type: 'path',
      d: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
    },
  ],
  heartFill: [
    {
      type: 'path',
      d: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
      filled: true,
    },
  ],
  bookmark: [{ type: 'path', d: 'M7 4h10v16l-5-3.5L7 20z' }],
  user: [
    { type: 'circle', cx: 12, cy: 8.5, r: 3.5 },
    { type: 'path', d: 'M5 20a7 7 0 0 1 14 0' },
  ],
  clock: [
    { type: 'circle', cx: 12, cy: 12, r: 8 },
    { type: 'path', d: 'M12 8v4l2.5 2' },
  ],
  flame: [
    {
      type: 'path',
      d: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 3-5.4 3.7-9.3 2.4 1.4 3.4 3.5 3.3 5.5 1-.6 1.8-1.7 2-3 2 1.8 4 4 4 6.8 0 3.6-2.6 6.2-6.5 6.2z',
    },
  ],
  plus: [{ type: 'path', d: 'M12 5v14M5 12h14' }],
  minus: [{ type: 'path', d: 'M5 12h14' }],
  close: [{ type: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  check: [{ type: 'path', d: 'M5 12.5l4.5 4.5L19 7.5' }],
  pause: [{ type: 'path', d: 'M8.5 5.5v13M15.5 5.5v13' }],
  timer: [
    { type: 'circle', cx: 12, cy: 13.5, r: 7 },
    { type: 'path', d: 'M12 10v3.5l2 1.5M9.5 3h5M12 3v3.5' },
  ],
  more: [
    { type: 'circle', cx: 5.5, cy: 12, r: 1.3, filled: true },
    { type: 'circle', cx: 12, cy: 12, r: 1.3, filled: true },
    { type: 'circle', cx: 18.5, cy: 12, r: 1.3, filled: true },
  ],
  eye: [
    { type: 'path', d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z' },
    { type: 'circle', cx: 12, cy: 12, r: 3 },
  ],
  basket: [
    { type: 'path', d: 'M3.5 10h17l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3z' },
    { type: 'path', d: 'M8 10l3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3' },
  ],
  flash: [{ type: 'path', d: 'M13 3L5.5 13.5H12L11 21l7.5-10.5H12z' }],
  flip: [
    { type: 'path', d: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3' },
    { type: 'path', d: 'M18 3v4h-4M6 21v-4h4' },
  ],
  trash: [{ type: 'path', d: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13' }],
  sort: [{ type: 'path', d: 'M4 7h10M4 12h7M4 17h4M17 5v14M14 16l3 3 3-3' }],
  edit: [{ type: 'path', d: 'M4 20h4L19 9l-4-4L4 16z' }],
  chevronDown: [{ type: 'path', d: 'M6 9l6 6 6-6' }],
  chevronUp: [{ type: 'path', d: 'M6 15l6-6 6 6' }],
  chevronRight: [{ type: 'path', d: 'M9 6l6 6-6 6' }],
  sparkle: [{ type: 'path', d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' }],
  alert: [
    { type: 'circle', cx: 12, cy: 12, r: 8.5 },
    { type: 'path', d: 'M12 7.5v5.5M12 16.3v.2' },
  ],
  swap: [{ type: 'path', d: 'M7 4L4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7' }],
  bowl: [
    { type: 'path', d: 'M3.5 11h17a8.5 8.5 0 0 1-17 0z' },
    { type: 'path', d: 'M9 7.5c0-1.5 1-1.5 1-3M13 7.5c0-1.5 1-1.5 1-3' },
  ],
  leaf: [
    { type: 'path', d: 'M5 19c0-8 5-13 14-14 0 9-5 14-13 14z' },
    { type: 'path', d: 'M5 19l8-8' },
  ],
  compass: [
    { type: 'circle', cx: 12, cy: 12, r: 8.5 },
    { type: 'path', d: 'M15.5 8.5l-2 5-5 2 2-5z' },
  ],
  sofa: [
    { type: 'path', d: 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3' },
    { type: 'path', d: 'M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v6H3z' },
    { type: 'path', d: 'M5 18v2M19 18v2' },
  ],
  dumbbell: [{ type: 'path', d: 'M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11' }],
  thermo: [
    { type: 'path', d: 'M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z' },
    { type: 'path', d: 'M12 10v6' },
  ],
  party: [
    { type: 'path', d: 'M4 20l4.5-12 7.5 7.5z' },
    { type: 'path', d: 'M14 4v2M19 9h2M17 6l1.5-1.5' },
  ],
} as const satisfies Record<string, readonly IconShape[]>;

export type IconName = keyof typeof iconShapes;

export const iconNames = Object.keys(iconShapes) as IconName[];
