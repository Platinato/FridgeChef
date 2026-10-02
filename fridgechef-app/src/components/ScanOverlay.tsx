import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, shadow } from '@/theme/tokens';

export type ScanOverlayInset = {
  top: DimensionValue;
  right: DimensionValue;
  bottom: DimensionValue;
  left: DimensionValue;
};

export type ScanOverlayProps = {
  /** Animate the lime scan line top → bottom → top (2.2s). */
  sweeping?: boolean;
  /** Frame position inside the parent. Default: the camera framing (19% 9% 50%). */
  inset?: ScanOverlayInset | number;
};

const CAMERA_INSET: ScanOverlayInset = { top: '19%', right: '9%', bottom: '50%', left: '9%' };
const SWEEP_MS = 2200;

/** Lime corner brackets + an optional sweeping scan line. Pure decoration. */
export function ScanOverlay({ sweeping = false, inset = CAMERA_INSET }: ScanOverlayProps) {
  const reduceMotion = useReducedMotion();
  const [height, setHeight] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!sweeping || reduceMotion) return;
    progress.set(
      withRepeat(
        withTiming(1, { duration: SWEEP_MS / 2, easing: Easing.bezier(...motion.easing) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(progress);
  }, [sweeping, reduceMotion, progress]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.get() * Math.max(0, height - 3) }],
  }));

  const box: ViewStyle =
    typeof inset === 'number' ? { top: inset, right: inset, bottom: inset, left: inset } : inset;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, box]}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      testID="scan-overlay"
    >
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      {sweeping ? <Animated.View style={[styles.line, lineStyle]} testID="scan-line" /> : null}
    </View>
  );
}

const C = 40;
const W = 4;
const R = 18;

const styles = StyleSheet.create({
  frame: { position: 'absolute', pointerEvents: 'none' },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.lime },
  tl: { top: 0, left: 0, borderTopWidth: W, borderLeftWidth: W, borderTopLeftRadius: R },
  tr: { top: 0, right: 0, borderTopWidth: W, borderRightWidth: W, borderTopRightRadius: R },
  bl: { bottom: 0, left: 0, borderBottomWidth: W, borderLeftWidth: W, borderBottomLeftRadius: R },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: W,
    borderRightWidth: W,
    borderBottomRightRadius: R,
  },
  line: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lime,
    boxShadow: shadow.scanGlow,
  },
});
