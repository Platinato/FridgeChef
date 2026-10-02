import type { ComponentProps, ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { minTouch, motion } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const timing = {
  duration: motion.duration,
  easing: Easing.bezier(...motion.easing),
};

/** Shared pressed feedback: scale down while pressed, spring back on release. */
export function usePressScale(
  pressedScale: number = motion.pressedScale,
  duration: number = motion.duration,
) {
  const scale = useSharedValue(1);
  const t = { ...timing, duration };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return {
    animatedStyle,
    onPressIn: () => scale.set(withTiming(pressedScale, t)),
    onPressOut: () => scale.set(withTiming(1, t)),
  };
}

/** `hitSlop` that grows a smaller visual to the 44pt minimum touch target. */
export function touchSlop(width: number, height: number = width) {
  const h = Math.max(0, Math.ceil((minTouch - width) / 2));
  const v = Math.max(0, Math.ceil((minTouch - height) / 2));
  return h === 0 && v === 0 ? undefined : { top: v, bottom: v, left: h, right: h };
}

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Plain or Reanimated animated styles (e.g. an animated width). */
  style?: ComponentProps<typeof AnimatedPressable>['style'];
  children?: ReactNode;
  /** Scale while pressed. Defaults to the mockup's 0.97. */
  pressedScale?: number;
};

/**
 * The base of every pressable primitive: a `Pressable` that scales to `pressedScale` over
 * 200 ms with the mockup easing (cubic-bezier(.2,.8,.2,1)). Disabled presses don't animate.
 * Reanimated honours the system Reduce Motion setting.
 */
export function PressableScale({
  pressedScale,
  style,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const press = usePressScale(pressedScale);
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        if (!disabled) press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={[style, press.animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
