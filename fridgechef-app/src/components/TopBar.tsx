import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';

export type TopBarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  /** Pin it over full-bleed media (below the status bar, inside the gutters). */
  overlay?: boolean;
};

/** Header row with left / center / right slots. */
export function TopBar({ left, center, right, overlay = false }: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, overlay && [styles.overlay, { top: insets.top + 4 }]]}>
      <View style={styles.side}>{left}</View>
      <View style={styles.center}>{center}</View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    minHeight: 52,
  },
  overlay: { position: 'absolute', left: spacing.gutter, right: spacing.gutter, zIndex: 5 },
  side: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minWidth: 44 },
  right: { justifyContent: 'flex-end' },
  center: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
});
