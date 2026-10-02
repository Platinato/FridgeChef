/**
 * Design tokens: a typed port of fridgechef-mockup/js/theme.js + styles/tokens.css.
 *
 * The ONLY place colour literals may appear (enforced by src/__tests__/content-rules.test.ts
 * for components and screens). If a component needs a new colour, add a named token here.
 */

const palette = {
  bg: '#0A0A0A',
  surface1: '#161616',
  surface2: '#1F1F1F',
  surface3: '#2A2A2A',
  border: '#2E2E2E',
  dash: 'rgba(255,255,255,0.18)',
  dashInk: 'rgba(10,10,10,0.22)',
  lime: '#C6F432',
  limeSoft: '#E3FA9C',
  limeDeep: '#9BC21E',
  lightCard: '#F2F2F2',
  text: '#FFFFFF',
  text2: '#9A9A9A',
  text3: '#5C5C5C',
  ink: '#0A0A0A',
  ink2: '#4A4A4A',
  alert: '#FF3B30',
  alertText: '#FF8A82',
  backdrop: '#9CC43A',
} as const;

export const colors = {
  ...palette,

  // Gradients (pass to expo-linear-gradient). `locations` mirror the CSS stops.
  lightGrad: ['#FFFFFF', '#CFCFCF'],
  photoFade: ['rgba(10,10,10,0)', '#1F3A0E', '#2B4A12'],
  photoFadeLocations: [0.4, 0.85, 1],
  heroTitleGrad: ['#FFFFFF', '#BDBDBD'],
  heroTitleGradLocations: [0.55, 1],
  imageFallbackGrad: ['#2B4A12', '#0A0A0A'],
  imageFallbackGradLocations: [0, 0.75],

  // Component-specific values from styles/components.css, named by role.
  white: '#FFFFFF',
  transparent: 'transparent',
  iconButtonDarkBorder: '#333333',
  glassBg: 'rgba(10,10,10,0.45)',
  glassBadgeBg: 'rgba(10,10,10,0.5)',
  glassBorder: 'rgba(255,255,255,0.12)',
  outlineBorder: 'rgba(255,255,255,0.22)',
  dangerBorder: 'rgba(255,59,48,0.4)',
  alertBg: 'rgba(255,59,48,0.14)',
  alertPulse: 'rgba(255,59,48,0.5)',
  limeRing: 'rgba(198,244,50,0.22)',
  disabledText: '#8A8A8A',
  tabText: '#CFCFCF',
  barOffOnDark: '#3A3A3A',
  barOffOnInk: 'rgba(10,10,10,0.15)',
  inkMuted: 'rgba(10,10,10,0.5)',
  shadow: 'rgba(0,0,0,0.5)',

  // Sprint 03 composites (styles/components.css).
  bgClear: 'rgba(10,10,10,0)',
  statusScrim: 'rgba(10,10,10,0.92)',
  heroFadeEnd: '#2B4A12',
  navBg: '#111111',
  sheetScrim: 'rgba(0,0,0,0.62)',
  grabHandle: '#3A3A3A',
  nodeBorder: '#3A3A3A',
  stepLink: 'rgba(255,255,255,0.3)',
  inkCaption: 'rgba(10,10,10,0.55)',
  inkDash: 'rgba(10,10,10,0.25)',
  photoRing: 'rgba(255,255,255,0.7)',
  ticketWhiteEnd: '#ECECEC',
  infoGlassBg: 'rgba(10,10,10,0.62)',
  infoGlassBorder: 'rgba(255,255,255,0.1)',
  infoAlertBg: 'rgba(40,10,8,0.78)',
  infoAlertBorder: 'rgba(255,59,48,0.45)',
  infoAlertText: '#D9B5B2',
  qtyFlagBorder: 'rgba(255,59,48,0.5)',
  qtyFlagTint: 'rgba(255,59,48,0.09)',
  qtyFlagTintEnd: 'rgba(255,59,48,0)',
  qtyDoneBorder: 'rgba(198,244,50,0.35)',
  markerLine: 'rgba(255,255,255,0.7)',
  thumbBorder: 'rgba(255,255,255,0.9)',
  thumbNumBg: 'rgba(10,10,10,0.7)',
  addTileBorder: 'rgba(255,255,255,0.55)',
  addTileBg: 'rgba(10,10,10,0.35)',
  softShadow: 'rgba(0,0,0,0.4)',
  deepShadow: 'rgba(0,0,0,0.55)',
  scanGlow: 'rgba(198,244,50,0.6)',

  // Sprint 07 scan flow (styles/screens.css).
  /** `.s-scan__panel` gradient middle stop (28%), between bgClear and bg. */
  scanPanelMid: 'rgba(10,10,10,0.78)',
  /** The viewfinder behind a denied / unavailable camera. */
  viewfinderBg: '#121212',
} as const;

export type ColorToken = {
  [K in keyof typeof colors]: (typeof colors)[K] extends string ? K : never;
}[keyof typeof colors];

/** Font sizes (pt). Display sizes use Bebas Neue, body sizes use Inter. */
export const type = {
  displayXL: 84,
  displayL: 56,
  displayM: 34,
  displayS: 22,
  bodyL: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const radii = { xl: 32, l: 28, m: 20, s: 14, pill: 999 } as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, gutter: 16 } as const;

/** Minimum touch target (Apple HIG). Smaller visuals get `hitSlop` up to this. */
export const minTouch = 44;

export const shadow = {
  float: `0px 10px 30px ${colors.shadow}`,
  stack: `0px 20px 40px ${colors.deepShadow}`,
  small: `0px 2px 6px ${colors.softShadow}`,
  scanGlow: `0px 0px 18px 4px ${colors.scanGlow}`,
} as const;

export const motion = {
  duration: 200,
  /** cubic-bezier(.2, .8, .2, 1) */
  easing: [0.2, 0.8, 0.2, 1] as const,
  pressedScale: 0.97,
  pulseDuration: 1600,
} as const;

export const device = { width: 390, height: 844, statusBar: 54, homeIndicator: 34 } as const;

/** Floating BottomNav geometry: 52pt items + 6pt padding + 1pt border on each side. */
export const nav = { height: 66, gapAbove: 38 } as const;

export const theme = {
  colors,
  type,
  radii,
  spacing,
  minTouch,
  shadow,
  motion,
  device,
  nav,
} as const;

export type Theme = typeof theme;
