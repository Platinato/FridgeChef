import { useEffect } from 'react';
import { StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
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
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { bodyFont, fonts } from '@/theme/fonts';
import { colors, minTouch, motion, radii } from '@/theme/tokens';

export type BadgeVariant = 'lime' | 'dark' | 'glass' | 'alert' | 'outline' | 'ink';
export type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  /** `red`: a static red dot (short / missing / please check). `live`: red dot with a white ring that pulses. */
  dot?: 'red' | 'live';
  icon?: IconName;
  size?: BadgeSize;
  /** Makes the badge pressable (e.g. the cook timer). */
  onPress?: () => void;
  /** Overrides the accessibility label (defaults to `label`). */
  accessibilityLabel?: string;
  testID?: string;
};

const variantStyle: Record<BadgeVariant, { box: ViewStyle; fg: string }> = {
  lime: { box: { backgroundColor: colors.lime }, fg: colors.ink },
  dark: { box: { backgroundColor: colors.surface3 }, fg: colors.text },
  glass: { box: { backgroundColor: colors.glassBadgeBg }, fg: colors.white },
  alert: { box: { backgroundColor: colors.alertBg }, fg: colors.alertText },
  outline: {
    box: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dash },
    fg: colors.text,
  },
  ink: { box: { backgroundColor: colors.ink }, fg: colors.white },
};

const sizeStyle: Record<BadgeSize, { box: ViewStyle; text: TextStyle; icon: number; dot: number }> =
  {
    sm: {
      box: { minHeight: 24, paddingHorizontal: 9, gap: 4 },
      text: { fontFamily: bodyFont(600), fontSize: 11 },
      icon: 14,
      dot: 8,
    },
    md: {
      box: { minHeight: 32, paddingHorizontal: 13, gap: 6 },
      text: { fontFamily: bodyFont(600), fontSize: 13 },
      icon: 14,
      dot: 8,
    },
    lg: {
      box: { minHeight: 56, paddingHorizontal: 24, gap: 10 },
      text: {
        fontFamily: fonts.display,
        fontSize: 26,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      },
      icon: 20,
      dot: 10,
    },
  };

/** The red status dot. `live` adds the white ring and the pulsing halo (Reduce Motion: static). */
export function StatusDot({ live = false, size = 8 }: { live?: boolean; size?: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!live || reduceMotion) return;
    progress.set(
      withRepeat(
        withTiming(1, { duration: motion.pulseDuration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(progress);
  }, [live, reduceMotion, progress]);

  // The halo starts under the 2pt white ring and grows to a 6pt spread while fading out.
  const ring = size + 4;
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [{ scale: 1 + progress.get() * ((size + 12) / ring - 1) }],
  }));

  return (
    <View
      style={[styles.dotWrap, { width: size, height: size }]}
      testID={live ? 'live-dot' : 'red-dot'}
    >
      {live ? (
        <Animated.View
          style={[
            styles.halo,
            { width: ring, height: ring, borderRadius: ring / 2, left: -2, top: -2 },
            haloStyle,
          ]}
        />
      ) : null}
      <View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2 },
          live && styles.dotRing,
        ]}
      />
    </View>
  );
}

/** Small pill label. Pressable when `onPress` is set. */
export function Badge({
  label,
  variant = 'lime',
  dot,
  icon,
  size = 'md',
  onPress,
  accessibilityLabel,
  testID,
}: BadgeProps) {
  const v = variantStyle[variant];
  const s = sizeStyle[size];
  const content = (
    <>
      {dot ? <StatusDot live={dot === 'live'} size={s.dot} /> : null}
      {icon ? <Icon name={icon} size={s.icon} color={v.fg} strokeWidth={2.25} /> : null}
      <AppText style={[s.text, { color: v.fg }]} numberOfLines={1}>
        {label}
      </AppText>
    </>
  );
  const boxStyle = [styles.base, v.box, s.box];

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        // Badges are wider than tall: only grow them vertically to the touch minimum.
        hitSlop={touchSlop(minTouch, s.box.minHeight as number)}
        style={boxStyle}
        testID={testID}
      >
        {content}
      </PressableScale>
    );
  }
  return (
    <View
      style={boxStyle}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    borderRadius: radii.pill,
  },
  dotWrap: { flexShrink: 0 },
  dot: { backgroundColor: colors.alert },
  dotRing: { boxShadow: `0px 0px 0px 2px ${colors.white}` },
  halo: { position: 'absolute', backgroundColor: colors.alertPulse },
});
