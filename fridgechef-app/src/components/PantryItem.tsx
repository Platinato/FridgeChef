import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StatusDot } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { LevelBars } from '@/components/LevelBars';
import { PressableScale } from '@/components/PressableScale';
import { Toggle } from '@/components/Toggle';
import { bodyFont } from '@/theme/fonts';
import { colors, spacing } from '@/theme/tokens';

/** The staple fields the item shows (Sprint 04's domain `Staple` is expected to satisfy this). */
export type PantryItemStaple = {
  id: string;
  name: string;
  /** 0-5 */
  level: number;
  /** Pack size hint, e.g. "~100 g jar". */
  unitHint: string;
};

export type PantryItemProps = {
  item: PantryItemStaple;
  /** Running low (computed by `domain/` from the staple's threshold): red dot + white bars. */
  low?: boolean;
  /** Pre-formatted, e.g. "2d ago" (rows only). */
  updatedLabel?: string;
  /** `row` (tappable list row, default) or `card` (small horizontal card on Home). */
  variant?: 'row' | 'card';
  /** Turns a row into a non-pressable "include" row with a switch (Confirm screen). */
  toggle?: { on: boolean; onChange: (next: boolean) => void };
  onPress?: () => void;
};

/** A remembered staple with its stock level. */
export function PantryItem({
  item,
  low = false,
  updatedLabel,
  variant = 'row',
  toggle,
  onPress,
}: PantryItemProps) {
  const level = Math.round(item.level);
  const bars = (size: number) => (
    <LevelBars
      level={item.level}
      color={low ? 'white' : 'lime'}
      size={size}
      label={`${item.name} stock ${level} of 5`}
    />
  );
  const a11y = `${item.name}, ${low ? 'running low, ' : ''}stock ${level} of 5`;

  if (variant === 'card') {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.cardName}>
          {low ? <StatusDot /> : null}
          <AppText variant="display" size={20} numberOfLines={1} style={styles.cardTitle}>
            {item.name}
          </AppText>
        </View>
        {bars(9)}
        <AppText style={styles.meta}>{item.unitHint}</AppText>
      </PressableScale>
    );
  }

  const text = (
    <View style={[styles.text, toggle && !toggle.on && styles.off]}>
      <View style={styles.name}>
        {low ? <StatusDot /> : null}
        <AppText style={styles.nameText} numberOfLines={1}>
          {item.name}
        </AppText>
      </View>
      <AppText style={styles.meta} numberOfLines={1}>
        {updatedLabel ? `${item.unitHint} · Updated ${updatedLabel}` : item.unitHint}
      </AppText>
    </View>
  );

  if (toggle) {
    return (
      <View style={[styles.row, styles.compact]}>
        {text}
        <View style={!toggle.on && styles.off}>{bars(10)}</View>
        <Toggle bare on={toggle.on} label={`Include ${item.name}`} onChange={toggle.onChange} />
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      pressedScale={0.985}
      style={styles.row}
    >
      {text}
      {bars(10)}
      <Icon name="chevronRight" size={18} color={colors.text2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    alignSelf: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    borderRadius: 20,
    backgroundColor: colors.surface1,
  },
  compact: { paddingVertical: 10, paddingLeft: spacing[4], paddingRight: spacing[3] },
  off: { opacity: 0.45 },
  text: { flex: 1, minWidth: 0, gap: 3 },
  name: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  nameText: {
    flexShrink: 1,
    fontFamily: bodyFont(600),
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  meta: { fontSize: 12, lineHeight: 16, color: colors.text2 },
  card: {
    width: 138,
    flexShrink: 0,
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardName: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  cardTitle: { flexShrink: 1, lineHeight: 20, paddingTop: 2 },
});
