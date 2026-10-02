import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, radii } from '@/theme/tokens';

export type PrimaryButtonVariant =
  'black' | 'lime' | 'outline' | 'ghost' | 'light' | 'danger' | 'glass';
export type PrimaryButtonSize = 'md' | 'sm' | 'xs';

export type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: PrimaryButtonVariant;
  /** md 56pt (default), sm 44pt, xs 36pt. */
  size?: PrimaryButtonSize;
  disabled?: boolean;
  /** Leading icon. CTAs like "Start cooking" and "Analyze N photos" stay text-only (content rules). */
  icon?: IconName;
  iconRight?: IconName;
  /** Stretch to the parent's width (default). `false` hugs the label. */
  full?: boolean;
  testID?: string;
};

const variantStyle: Record<PrimaryButtonVariant, { box: ViewStyle; fg: string }> = {
  black: { box: { backgroundColor: colors.ink }, fg: colors.white },
  lime: { box: { backgroundColor: colors.lime }, fg: colors.ink },
  outline: { box: { borderWidth: 1.5, borderColor: colors.outlineBorder }, fg: colors.text },
  ghost: { box: { paddingHorizontal: 12 }, fg: colors.text2 },
  light: { box: { backgroundColor: colors.white }, fg: colors.ink },
  danger: { box: { borderWidth: 1.5, borderColor: colors.dangerBorder }, fg: colors.alertText },
  // No backdrop blur yet (expo-blur isn't a dependency) - translucent fill only.
  glass: {
    box: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
    fg: colors.white,
  },
};

const sizeStyle: Record<PrimaryButtonSize, { box: ViewStyle; text: TextStyle; icon: number }> = {
  md: {
    box: { minHeight: 56, paddingHorizontal: 24 },
    text: { fontSize: 17, lineHeight: 22 },
    icon: 20,
  },
  sm: {
    box: { minHeight: 44, paddingHorizontal: 18 },
    text: { fontSize: 15, lineHeight: 20 },
    icon: 20,
  },
  xs: {
    box: { minHeight: 36, paddingHorizontal: 14 },
    text: { fontSize: 13, lineHeight: 17 },
    icon: 16,
  },
};

/** Pill CTA. */
export function PrimaryButton({
  label,
  onPress,
  variant = 'black',
  size = 'md',
  disabled = false,
  icon,
  iconRight,
  full = true,
  testID,
}: PrimaryButtonProps) {
  const v = variantStyle[variant];
  const s = sizeStyle[size];
  const fg = disabled ? colors.disabledText : v.fg;
  const height = s.box.minHeight as number;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={touchSlop(height, height)}
      testID={testID}
      style={[
        styles.base,
        s.box,
        v.box,
        full ? styles.full : styles.hug,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Icon name={icon} size={s.icon} color={fg} strokeWidth={2.25} /> : null}
      <AppText numberOfLines={1} style={[styles.label, s.text, { color: fg }]}>
        {label}
      </AppText>
      {iconRight ? <Icon name={iconRight} size={s.icon} color={fg} strokeWidth={2.25} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
    borderRadius: radii.pill,
  },
  full: { alignSelf: 'stretch' },
  hug: { alignSelf: 'flex-start' },
  label: { fontFamily: bodyFont(600) },
  disabled: {
    backgroundColor: colors.surface3,
    borderColor: colors.transparent,
  },
});
