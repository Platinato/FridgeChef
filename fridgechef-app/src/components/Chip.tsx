import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, radii } from '@/theme/tokens';

export type ChipProps = {
  label: string;
  active?: boolean;
  icon?: IconName;
  size?: 'md' | 'sm';
  onPress?: () => void;
  testID?: string;
};

/** Pill toggle. Active = lime on ink, inactive = dark with grey text. */
export function Chip({ label, active = false, icon, size = 'md', onPress, testID }: ChipProps) {
  const fg = active ? colors.ink : colors.text2;
  const height = size === 'sm' ? 38 : 44;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={touchSlop(height, height)}
      testID={testID}
      style={[styles.base, size === 'sm' && styles.sm, active && styles.active]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <AppText
        numberOfLines={1}
        style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          { color: fg, fontFamily: bodyFont(active ? 600 : 500) },
        ]}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  sm: { minHeight: 38, paddingHorizontal: 14 },
  active: { backgroundColor: colors.lime },
  label: { fontSize: 14, lineHeight: 18 },
  labelSm: { fontSize: 13, lineHeight: 17 },
});
