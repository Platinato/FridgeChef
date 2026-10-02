import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { DashedLine } from '@/components/DashedLine';
import { FallbackImage } from '@/components/FallbackImage';
import { bodyFont } from '@/theme/fonts';
import { colors, spacing } from '@/theme/tokens';

export type IngredientStatus = 'have' | 'pantry' | 'short' | 'missing';

export type IngredientRowProps = {
  name: string;
  /** Formatted amount, e.g. "400 g" (unit formatting lives in `domain/`). */
  qty: string;
  status: IngredientStatus;
  thumb?: string;
  /** Grey second line, e.g. "You have 500 g" or a swap hint. */
  note?: string;
  /** Hide the dashed rule under the last row. */
  last?: boolean;
};

const statusBadge: Record<IngredientStatus, () => ReactElement> = {
  have: () => <Badge label="Have" icon="check" variant="lime" size="sm" />,
  pantry: () => <Badge label="Pantry" variant="dark" size="sm" />,
  short: () => <Badge label="Short" dot="red" variant="alert" size="sm" />,
  missing: () => <Badge label="Missing" dot="red" variant="alert" size="sm" />,
};

/** Recipe ingredient with a have / pantry / short / missing badge. */
export function IngredientRow({
  name,
  qty,
  status,
  thumb,
  note,
  last = false,
}: IngredientRowProps) {
  return (
    <View style={styles.row}>
      <FallbackImage
        uri={thumb}
        label={name}
        fallback="plain"
        initialsSize={17}
        style={styles.thumb}
      />
      <View style={styles.text}>
        <AppText style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        {note ? <AppText style={styles.note}>{note}</AppText> : null}
      </View>
      <AppText variant="display" size={20} style={styles.qty}>
        {qty}
      </AppText>
      {statusBadge[status]()}
      {last ? null : <DashedLine style={styles.rule} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: 11,
  },
  thumb: { width: 42, height: 42, borderRadius: 12 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: bodyFont(600), fontSize: 15, lineHeight: 20, color: colors.text },
  note: { fontSize: 12, lineHeight: 16, color: colors.text2 },
  qty: { lineHeight: 20, paddingTop: 2 },
  rule: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
