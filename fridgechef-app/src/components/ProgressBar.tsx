import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { bodyFont } from '@/theme/fonts';
import { colors, motion, radii } from '@/theme/tokens';

export type ProgressBarVariant = 'lime' | 'soft' | 'white';

export type ProgressBarProps = {
  value: number;
  /** Default 1. */
  max?: number;
  /** Optional head row: label on the left… */
  label?: string;
  /** …and a grey caption on the right (e.g. "32 g"). */
  caption?: string;
  variant?: ProgressBarVariant;
  /** Unknown progress (waiting for a reply): a short segment slides along the track. */
  indeterminate?: boolean;
};

const SEGMENT = 0.32;
const SLIDE_MS = 1100;
const FILL_MS = 300;

const fill: Record<ProgressBarVariant, string> = {
  lime: colors.lime,
  soft: colors.limeSoft,
  white: colors.white,
};

/** Thin rounded bar (cook progress, detection progress, macros). */
export function ProgressBar({
  value,
  max = 1,
  label,
  caption = '',
  variant = 'lime',
  indeterminate = false,
}: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value / (max || 1)));
  const busy = indeterminate ? { busy: true } : undefined;
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={indeterminate ? undefined : { min: 0, max, now: value }}
      accessibilityState={busy}
    >
      {label ? (
        <View style={styles.head}>
          <AppText style={styles.label}>{label}</AppText>
          <AppText style={styles.caption}>{caption}</AppText>
        </View>
      ) : null}
      <View style={styles.track}>
        {indeterminate ? (
          <Sliding color={fill[variant]} />
        ) : (
          <Fill ratio={ratio} color={fill[variant]} />
        )}
      </View>
    </View>
  );
}

/** The fill eases to a new value over 300 ms (mockup `.c-progress` transition); instant with Reduce Motion. */
function Fill({ ratio, color }: { ratio: number; color: string }) {
  const width = useSharedValue(ratio);
  useEffect(() => {
    width.set(withTiming(ratio, { duration: FILL_MS, easing: Easing.bezier(...motion.easing) }));
  }, [ratio, width]);
  const style = useAnimatedStyle(() => ({
    width: `${(width.get() * 100).toFixed(1)}%` as `${number}%`,
  }));
  return (
    <Animated.View
      testID="progress-fill"
      style={[styles.fill, { backgroundColor: color }, style]}
    />
  );
}

/** The indeterminate segment: left → right on repeat (static, centred, with Reduce Motion). */
function Sliding({ color }: { color: string }) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    x.set(
      withRepeat(
        withTiming(1, { duration: SLIDE_MS, easing: Easing.bezier(...motion.easing) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(x);
  }, [reduceMotion, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (reduceMotion ? 0.5 : x.get()) * width * (1 - SEGMENT) }],
  }));

  return (
    <View style={styles.slideTrack} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        testID="progress-indeterminate"
        style={[styles.fill, styles.segment, { backgroundColor: color }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: bodyFont(600), fontSize: 14, lineHeight: 18, color: colors.text },
  caption: { fontFamily: bodyFont(500), fontSize: 14, lineHeight: 18, color: colors.text2 },
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
  slideTrack: { flex: 1 },
  segment: { width: `${SEGMENT * 100}%` },
});
