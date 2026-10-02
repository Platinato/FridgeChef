import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { haptics } from '@/components/haptics';
import { PressableScale } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, motion, radii } from '@/theme/tokens';

export type ToggleProps = {
  on: boolean;
  /** Visible label, or the accessibility label when `bare`. */
  label: string;
  /** Grey second line under the label. */
  sub?: string;
  /** Receives the next value. */
  onChange?: (next: boolean) => void;
  /** Render the switch alone (label is still announced). */
  bare?: boolean;
  disabled?: boolean;
  testID?: string;
};

const KNOB_TRAVEL = 20;

/** iOS-style switch, lime when on. Custom-drawn so it matches the mockup exactly. */
export function Toggle({ on, label, sub, onChange, bare = false, disabled, testID }: ToggleProps) {
  const x = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    x.set(
      withTiming(on ? 1 : 0, {
        duration: motion.duration,
        easing: Easing.bezier(...motion.easing),
      }),
    );
  }, [on, x]);
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() * KNOB_TRAVEL }],
  }));

  const track = (
    <View style={[styles.track, on && styles.trackOn]}>
      <Animated.View style={[styles.knob, on && styles.knobOn, knobStyle]} />
    </View>
  );

  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={sub}
      accessibilityState={{ checked: on, disabled: !!disabled }}
      onPress={() => {
        haptics.selection();
        onChange?.(!on);
      }}
      disabled={disabled}
      pressedScale={1}
      testID={testID}
      style={[bare ? styles.bare : styles.row, disabled && styles.disabled]}
    >
      {bare ? null : (
        <View style={styles.text}>
          <AppText style={styles.label}>{label}</AppText>
          {sub ? <AppText variant="caption">{sub}</AppText> : null}
        </View>
      )}
      {track}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    alignSelf: 'stretch',
    minHeight: 44,
  },
  bare: { minHeight: 44, minWidth: 52, justifyContent: 'center', alignSelf: 'flex-start' },
  disabled: { opacity: 0.4 },
  text: { flexShrink: 1, gap: 2 },
  label: { fontFamily: bodyFont(600), fontSize: 15, lineHeight: 20, color: colors.text },
  track: {
    width: 52,
    height: 32,
    flexShrink: 0,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  trackOn: { backgroundColor: colors.lime },
  knob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  knobOn: { backgroundColor: colors.ink },
});
