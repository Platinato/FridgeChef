/** Base ↔ alt unit conversion for detected items. Port of mockup `logic.display` + the `setQty` helper. */
import type { DetectedItem } from './types';

/** Round to the nearest step. Trims float noise (0.1 + 0.2) to 6 decimals; the mockup value is otherwise unchanged. */
export const snap = (value: number, step: number): number =>
  Number((Math.round(value / step) * step).toFixed(6));

export const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, value));

/** An item's value and range in the unit the user is viewing it in. */
export type DisplayValue = {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** The detection estimate in the display unit; `null` for manual items. */
  estimate: number | null;
};

const inAlt = (item: DetectedItem): boolean =>
  !!item.altUnit && item.displayUnit === item.altUnit.unit;

/** Value + range in the display unit, snapped to the alt unit's step. */
export function displayOf(item: DetectedItem): DisplayValue {
  const alt = item.altUnit;
  if (!alt || !inAlt(item)) {
    const { value, min, max, step, unit, estimate } = item;
    return { value, min, max, step, unit, estimate };
  }
  const f = alt.factor;
  const s = alt.step;
  return {
    value: snap(item.value / f, s),
    min: snap(item.min / f, s),
    max: snap(item.max / f, s),
    step: s,
    unit: alt.unit,
    estimate: item.estimate === null ? null : snap(item.estimate / f, s),
  };
}

/** A value in the display unit → the base unit, clamped to the item's range. */
export function toBase(item: DetectedItem, displayValue: number): number {
  const f = item.altUnit && inAlt(item) ? item.altUnit.factor : 1;
  return clamp(Number((displayValue * f).toFixed(4)), item.min, item.max);
}

/** The units an item can be shown in (base first), for the QuantitySlider unit switch. */
export const unitsOf = (item: DetectedItem): string[] =>
  item.altUnit ? [item.unit, item.altUnit.unit] : [item.unit];
