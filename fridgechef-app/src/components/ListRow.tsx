import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, spacing } from '@/theme/tokens';

export type ListRowProps = {
  label: string;
  /** Grey value on the right, truncated. */
  detail?: string;
  icon?: IconName;
  /** Makes the row a button with a chevron. */
  onPress?: () => void;
  /** Custom trailing control (replaces the chevron), e.g. a Stepper or Toggle. */
  right?: ReactNode;
  /** Red label (destructive rows). */
  danger?: boolean;
};

/** Settings-style row: icon · label · detail · chevron (or a custom `right`). */
export function ListRow({ label, detail, icon, onPress, right, danger = false }: ListRowProps) {
  const trailing =
    right !== undefined ? (
      right
    ) : onPress ? (
      <Icon name="chevronRight" size={18} color={colors.text2} />
    ) : null;

  const content = (
    <>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={18} color={colors.white} />
        </View>
      ) : null}
      <AppText style={[styles.label, danger && styles.danger]}>{label}</AppText>
      {detail != null ? (
        <AppText style={styles.detail} numberOfLines={1}>
          {detail}
        </AppText>
      ) : null}
      {trailing}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={detail != null ? `${label}, ${detail}` : label}
        onPress={onPress}
        pressedScale={0.985}
        style={styles.row}
      >
        {content}
      </PressableScale>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    alignSelf: 'stretch',
    minHeight: 58,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 20,
    backgroundColor: colors.surface1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: bodyFont(600),
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  danger: { color: colors.alertText },
  detail: {
    maxWidth: '55%',
    fontSize: 14,
    lineHeight: 18,
    color: colors.text2,
    textAlign: 'right',
  },
});
