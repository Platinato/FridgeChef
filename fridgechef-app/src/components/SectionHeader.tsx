import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StatusDot } from '@/components/Badge';
import { bodyFont } from '@/theme/fonts';
import { colors, radii, spacing } from '@/theme/tokens';

export type SectionHeaderProps = {
  title: string;
  /** Red dot before the title ("Running low"). */
  dot?: boolean;
  /** Small grey count pill after the title. */
  count?: number;
  /** A lime text action on the right ("See all"). Takes precedence over `right`. */
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
};

/** Condensed section label with an optional dot, count and action. */
export function SectionHeader({
  title,
  dot,
  count,
  actionLabel,
  onAction,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View
        style={styles.title}
        accessible
        accessibilityRole="header"
        accessibilityLabel={count != null ? `${title}, ${count}` : title}
      >
        {dot ? <StatusDot /> : null}
        <AppText variant="display" size={28} style={styles.titleText}>
          {title}
        </AppText>
        {count != null ? (
          <View style={styles.count}>
            <AppText style={styles.countText}>{count}</AppText>
          </View>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppText style={styles.actionText}>{actionLabel}</AppText>
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginTop: 4,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexShrink: 1 },
  titleText: { lineHeight: 28, paddingTop: 3 },
  count: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  countText: { fontFamily: bodyFont(600), fontSize: 12, lineHeight: 13, color: colors.text2 },
  action: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  actionText: { fontFamily: bodyFont(600), fontSize: 14, lineHeight: 18, color: colors.lime },
  pressed: { opacity: 0.6 },
});
