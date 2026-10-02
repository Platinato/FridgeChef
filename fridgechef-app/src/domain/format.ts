/** Display formatting. Port of mockup `logic.js` / `util.js` helpers. */
import type { LastScan } from './types';

const DAY_MS = 864e5;
const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** Rounds to 2 decimals: 3.14159 → "3.14", 2 → "2". */
export const fmtNum = (n: number): string => String(Math.round(n * 100) / 100);

/** A quantity with quarter fractions: 0.5 tsp → "½ tsp", 1.25 cup → "1¼ cup", 400 g → "400 g". */
export function fmtQty(value: number, unit: string): string {
  const n = Math.round(value * 100) / 100;
  const whole = Math.floor(n);
  const frac = FRACTIONS[String(Math.round((n - whole) * 100) / 100)];
  return `${frac ? (whole || '') + frac : n} ${unit}`;
}

/** "1 photo", "3 photos". */
export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Whole days since an ISO timestamp (never negative). */
export const daysSince = (iso: string, now: number = Date.now()): number =>
  Math.max(0, Math.floor((now - new Date(iso).getTime()) / DAY_MS));

/** ISO timestamp `days` before `now`. */
export const daysAgo = (days: number, now: number = Date.now()): string =>
  new Date(now - days * DAY_MS).toISOString();

/** "today", "yesterday", "9d ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const d = daysSince(iso, now);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;
}

/** Home's "Last scan" line: "2 days ago · 11 items". */
export function lastScanLabel(lastScan: LastScan, now: number = Date.now()): string {
  const d = daysSince(lastScan.at, now);
  const when = d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
  return `${when} · ${lastScan.items} items`;
}

/** Recipe effort 1-5 → "Minimal" / "Moderate" / "Chef mode". */
export const effortLabel = (level: number): string =>
  level <= 1 ? 'Minimal' : level <= 3 ? 'Moderate' : 'Chef mode';
