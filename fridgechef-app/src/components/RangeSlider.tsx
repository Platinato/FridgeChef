import Slider from '@react-native-community/slider';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { formatStepperValue, stepValue } from '@/components/Stepper';
import { bodyFont } from '@/theme/fonts';
import { colors, radii, spacing } from '@/theme/tokens';

export type RangeSliderMarker = {
  value: number;
  /** A bare number, e.g. "500" (content rules: never label it as a machine estimate). */
  label: string;
};

export type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: number;
  /** Fires once, on release. */
  onChange?: (value: number) => void;
  /** Fires on every tick while dragging (keep it cheap). */
  onChanging?: (value: number) => void;
  unit?: string;
  /** Scale labels at these values (Mood: 15 / 30 / 60 / 90) instead of min / max. */
  marks?: number[];
  /** The estimate tick above the track. */
  marker?: RangeSliderMarker;
  /** Accessibility label. */
  label?: string;
  /** Only the track + scale (QuantitySlider composes it). */
  bare?: boolean;
  minLabel?: string;
  maxLabel?: string;
};

const THUMB = 28;
const ADJUST_ACTIONS = [{ name: 'increment' as const }, { name: 'decrement' as const }];

/** Centre of a 28pt thumb at `value`: 14 + pct × (width − 28), as in the mockup. */
export function thumbCenter(value: number, min: number, max: number, width: number) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  return THUMB / 2 + pct * (width - THUMB);
}

/**
 * Lime-filled slider. The native `@react-native-community/slider` handles touch, a11y and the
 * white thumb; its own tracks are transparent and the mockup's 8pt track, fill, thumb halo and
 * estimate tick are drawn underneath from the same thumb-centre formula.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onChanging,
  unit = '',
  marks = [],
  marker,
  label = 'Value',
  bare = false,
  minLabel,
  maxLabel,
}: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  // Value under the finger while dragging; otherwise the controlled `value` (stepper, reset).
  const [dragging, setDragging] = useState<number | null>(null);
  const live = dragging ?? value;
  // Some platforms also fire onValueChange when `value` changes from outside; only a real drag counts.
  const touching = useRef(false);

  const center = (v: number) => thumbCenter(v, min, max, width);

  const track = (
    <View>
      {/* One adjustable element for VoiceOver: the value with its unit, and swipe up / down
          moving by `step` (the native slider alone steps by 10% of the range). */}
      <View
        style={styles.range}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{
          min,
          max,
          now: live,
          text: `${formatStepperValue(live)} ${unit}`.trim(),
        }}
        accessibilityActions={ADJUST_ACTIONS}
        onAccessibilityAction={(e) => {
          const direction = e.nativeEvent.actionName === 'increment' ? 1 : -1;
          const next = stepValue(value, step, direction, min, max);
          if (next !== value) onChange?.(next);
        }}
        testID="range-slider"
      >
        <View style={styles.track}>
          {width > 0 ? (
            <View testID="range-fill" style={[styles.fill, { width: center(live) }]} />
          ) : null}
        </View>
        {width > 0 ? <View style={[styles.halo, { left: center(live) - 19 }]} /> : null}
        {marker && width > 0 ? (
          <View
            testID="range-marker"
            style={[styles.marker, { left: center(marker.value) - MARKER_BOX / 2 }]}
          >
            <View style={styles.markerPill}>
              <AppText style={styles.markerText}>{marker.label}</AppText>
            </View>
            <View style={styles.markerLine} />
          </View>
        ) : null}
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          minimumTrackTintColor={colors.transparent}
          maximumTrackTintColor={colors.transparent}
          thumbTintColor={colors.white}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onSlidingStart={(v) => {
            touching.current = true;
            setDragging(v);
          }}
          onValueChange={(v) => {
            if (!touching.current) return;
            setDragging(v);
            onChanging?.(v);
          }}
          onSlidingComplete={(v) => {
            touching.current = false;
            setDragging(null);
            onChange?.(v);
          }}
        />
      </View>
      {marks.length ? (
        <View style={styles.marks}>
          {width > 0
            ? marks.map((m) => (
                <AppText
                  key={m}
                  style={[styles.scaleText, styles.mark, { left: center(m) - MARK_BOX / 2 }]}
                >
                  {formatStepperValue(m)}
                </AppText>
              ))
            : null}
        </View>
      ) : (
        <View style={styles.scale}>
          <AppText style={styles.scaleText}>
            {minLabel ?? `${formatStepperValue(min)} ${unit}`.trim()}
          </AppText>
          <AppText style={styles.scaleText}>
            {maxLabel ?? `${formatStepperValue(max)} ${unit}`.trim()}
          </AppText>
        </View>
      )}
    </View>
  );

  if (bare) return track;
  return (
    <View style={styles.wrap}>
      <View style={styles.value}>
        <AppText variant="display" size={56} color="lime" testID="range-value">
          {formatStepperValue(live)}
        </AppText>
        {unit ? (
          <AppText variant="display" size={24} color="text2">
            {unit}
          </AppText>
        ) : null}
      </View>
      {track}
    </View>
  );
}

const MARKER_BOX = 64;
const MARK_BOX = 40;

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  range: { height: 48 },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 26,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.lime },
  // Stands in for the mockup's 5pt lime ring around the thumb (the native thumb can't be styled).
  halo: {
    position: 'absolute',
    top: 11,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.limeRing,
    pointerEvents: 'none',
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: MARKER_BOX,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  markerPill: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.limeSoft,
  },
  markerText: {
    fontFamily: bodyFont(700),
    fontSize: 9,
    lineHeight: 10,
    letterSpacing: 0.36,
    color: colors.ink,
  },
  markerLine: {
    width: 2,
    height: 14,
    marginTop: 2,
    borderRadius: 1,
    backgroundColor: colors.markerLine,
  },
  // The native slider centres its thumb vertically: 40pt tall from 10 → thumb centre at 30,
  // the middle of the 8pt track (top 26).
  slider: { position: 'absolute', left: 0, right: 0, top: 10, height: 40 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  marks: { height: 16, marginTop: -2 },
  mark: { position: 'absolute', top: 0, width: MARK_BOX, textAlign: 'center' },
  scaleText: { fontSize: 12, lineHeight: 16, color: colors.text2 },
});
