import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FallbackImage } from '@/components/FallbackImage';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { colors } from '@/theme/tokens';

export type IconButtonVariant = 'dark' | 'lime' | 'ghost' | 'glass' | 'ink';

type Common = {
  /** Accessibility label (required: the button has no visible text). */
  label: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  /** Red notification dot, top right. */
  badge?: boolean;
  /** Diameter in pt. Default 44. */
  size?: number;
  disabled?: boolean;
  testID?: string;
};

export type IconButtonProps = Common &
  (
    | { icon: IconName; image?: never }
    /** A round photo thumb instead of an icon (e.g. the last gallery photo). */
    | { image: string; icon?: never }
  );

const variantStyle: Record<IconButtonVariant, { box: ViewStyle; fg: string }> = {
  dark: {
    box: {
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.iconButtonDarkBorder,
    },
    fg: colors.text,
  },
  lime: { box: { backgroundColor: colors.lime }, fg: colors.ink },
  ghost: {
    box: { backgroundColor: colors.transparent, borderWidth: 1, borderColor: colors.border },
    fg: colors.text2,
  },
  // No backdrop blur yet (expo-blur isn't a dependency) - translucent fill only.
  glass: {
    box: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
    fg: colors.white,
  },
  ink: { box: { backgroundColor: colors.ink }, fg: colors.white },
};

/** Circular icon action (44pt by default). */
export function IconButton({
  icon,
  image,
  label,
  onPress,
  variant = 'dark',
  badge = false,
  size = 44,
  disabled = false,
  testID,
}: IconButtonProps) {
  const v = variantStyle[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.94}
      hitSlop={touchSlop(size)}
      testID={testID}
      style={[
        styles.base,
        { width: size, height: size },
        image ? styles.image : v.box,
        disabled && styles.disabled,
      ]}
    >
      {image ? (
        <FallbackImage
          uri={image}
          label={label}
          style={styles.fill}
          initialsSize={Math.round(size * 0.4)}
        />
      ) : icon ? (
        <Icon name={icon} size={Math.round(size * 0.46)} color={v.fg} />
      ) : null}
      {badge ? <View style={styles.dot} testID="iconbutton-badge" /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 999,
  },
  image: { overflow: 'hidden', borderWidth: 2, borderColor: colors.white, padding: 0 },
  disabled: { opacity: 0.4 },
  fill: { width: '100%', height: '100%', borderRadius: 999 },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alert,
    boxShadow: `0px 0px 0px 2px ${colors.surface3}`,
  },
});
