import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';

export type PaginationDotsProps = {
  count: number;
  /** 0-based index of the current step. */
  active: number;
};

/** Onboarding progress: the active dot stretches into a lime pill. */
export function PaginationDots({ count, active }: PaginationDotsProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Step ${active + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.barOffOnDark },
  dotOn: { width: 28, backgroundColor: colors.lime },
});
