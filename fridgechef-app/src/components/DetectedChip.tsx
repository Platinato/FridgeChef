import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { StatusDot } from '@/components/Badge';
import { DashedLine } from '@/components/DashedLine';
import { Icon } from '@/components/Icon';
import { bodyFont } from '@/theme/fonts';
import { colors, motion, radii } from '@/theme/tokens';

export type DetectedChipProps = {
  name: string;
  /** `low` shows the red dot instead of the lime check. */
  confidence?: 'high' | 'med' | 'low';
  /** Pop in (opacity 0 → 1, scale 0.6 → 1, 320ms) when mounted. */
  animate?: boolean;
  /** Dashed tail joining it to the previous chip (every chip but the first). */
  connector?: boolean;
};

/** An ingredient the scan found (Analyzing screen). */
export function DetectedChip({
  name,
  confidence,
  animate = false,
  connector = false,
}: DetectedChipProps) {
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(animate && !reduceMotion ? 0 : 1);

  useEffect(() => {
    shown.set(withTiming(1, { duration: 320, easing: Easing.bezier(...motion.easing) }));
  }, [shown]);

  const pop = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ scale: 0.6 + 0.4 * shown.get() }],
  }));

  return (
    <Animated.View
      style={[styles.chip, pop]}
      accessible
      accessibilityLabel={confidence === 'low' ? `${name}, please check` : name}
    >
      {connector ? <DashedLine thickness={1.5} style={styles.tail} /> : null}
      {confidence === 'low' ? (
        <StatusDot />
      ) : (
        <Icon name="check" size={14} color={colors.lime} strokeWidth={2.75} />
      )}
      <AppText style={styles.text}>{name}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Sits in the 10pt gap to the left of the chip (CSS: right 100%, top 50%, width 10).
  tail: { position: 'absolute', right: '100%', top: 18, width: 10 },
  text: { fontFamily: bodyFont(500), fontSize: 14, lineHeight: 18, color: colors.white },
});
