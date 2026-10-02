import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radii } from '@/theme/tokens';

export type StatTileVariant = 'lime' | 'white' | 'soft';

export type StatTileProps = {
  /** Big condensed value, e.g. "35". */
  value: string;
  /** Unit / caption after the value, e.g. "MIN" or "KCAL". */
  caption: string;
  variant?: StatTileVariant;
  /** 88pt instead of 72pt (StatTileRow makes the first tile tall). */
  tall?: boolean;
};

const bg: Record<StatTileVariant, string> = {
  lime: colors.lime,
  white: colors.white,
  soft: colors.limeSoft,
};

/** Rounded tile with a big condensed number and caption (recipe time / kcal / protein). */
export function StatTile({ value, caption, variant = 'lime', tall = false }: StatTileProps) {
  return (
    <View
      style={[styles.tile, { backgroundColor: bg[variant] }, tall && styles.tall]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${value} ${caption}`}
    >
      <View style={styles.line}>
        <AppText variant="display" size={26} color="ink" style={styles.value}>
          {value}
        </AppText>
        <AppText variant="display" size={17} style={styles.caption}>
          {caption}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderRadius: radii.m,
  },
  tall: { minHeight: 88 },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 5 },
  value: { lineHeight: 26 },
  caption: { lineHeight: 17, color: colors.inkMuted },
});
