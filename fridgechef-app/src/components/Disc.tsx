import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { colors } from '@/theme/tokens';

export type DiscVariant = 'ink' | 'lime' | 'dark';

export type DiscProps = {
  /** Short display label (e.g. "35'"), used when there is no icon. */
  label?: string;
  icon?: IconName;
  /** Diameter in pt. Default 52. */
  size?: number;
  variant?: DiscVariant;
  /** The lime variant's 8pt halo. Default true; InfoCard turns it off. */
  ring?: boolean;
  /** Makes the disc a button. */
  onPress?: () => void;
  /** Accessibility label; required in practice when the disc is icon-only and pressable. */
  accessibilityLabel?: string;
  testID?: string;
};

const variantStyle: Record<DiscVariant, { box: ViewStyle; fg: string }> = {
  ink: { box: { backgroundColor: colors.ink }, fg: colors.white },
  lime: { box: { backgroundColor: colors.lime }, fg: colors.ink },
  dark: { box: { backgroundColor: colors.surface3 }, fg: colors.text },
};

/** Solid circle holding a short display label or an icon. */
export function Disc({
  label,
  icon,
  size = 52,
  variant = 'ink',
  ring = true,
  onPress,
  accessibilityLabel,
  testID,
}: DiscProps) {
  const v = variantStyle[variant];
  const inner = icon ? (
    <Icon name={icon} size={Math.round(size * 0.42)} color={v.fg} strokeWidth={2} />
  ) : (
    <AppText
      variant="display"
      size={Math.round(size * 0.42)}
      style={[styles.label, { color: v.fg }]}
    >
      {label}
    </AppText>
  );
  const boxStyle = [
    styles.base,
    { width: size, height: size, borderRadius: size / 2 },
    v.box,
    variant === 'lime' && ring && styles.ring,
  ];

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        pressedScale={0.94}
        hitSlop={touchSlop(size)}
        style={boxStyle}
        testID={testID}
      >
        {inner}
      </PressableScale>
    );
  }
  return (
    <View
      style={boxStyle}
      accessible={!!(accessibilityLabel ?? label)}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ring: { boxShadow: `0px 0px 0px 8px ${colors.limeRing}` },
  // Bebas sits low in its line box; the mockup nudges it with padding-top: .08em.
  label: { paddingTop: 2 },
});
