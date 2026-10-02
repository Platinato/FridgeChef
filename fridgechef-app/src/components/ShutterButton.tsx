import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { haptics } from '@/components/haptics';
import { usePressScale } from '@/components/PressableScale';
import { colors } from '@/theme/tokens';

export type ShutterButtonProps = {
  onPress?: () => void;
  /** e.g. at the 6-photo limit. */
  disabled?: boolean;
};

/** White ring with a lime core that squeezes to 0.86 while pressed (120ms). */
export function ShutterButton({ onPress, disabled = false }: ShutterButtonProps) {
  const press = usePressScale(0.86, 120);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Take photo"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.ring, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.core, press.animatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 80,
    height: 80,
    flexShrink: 0,
    padding: 6,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
  },
  core: { flex: 1, borderRadius: 999, backgroundColor: colors.lime },
  disabled: { opacity: 0.4 },
});
