import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { colors, minTouch } from '@/theme/tokens';

export type LevelBarsColor = 'lime' | 'white' | 'ink';

export type LevelBarsProps = {
  /** Filled squares (rounded). */
  level?: number;
  max?: number;
  color?: LevelBarsColor;
  /** Square edge in pt. Default 10. */
  size?: number;
  /** Input mode: every square is pressable and reports its 1-based level. */
  onChange?: (level: number) => void;
  /** Accessibility label for the group. Defaults to "Level N of M". */
  label?: string;
  testID?: string;
};

const palette: Record<LevelBarsColor, { on: string; off: string }> = {
  lime: { on: colors.lime, off: colors.surface3 },
  white: { on: colors.white, off: colors.barOffOnDark },
  ink: { on: colors.ink, off: colors.barOffOnInk },
};

/** Row of small squares (■■■□□) for effort or stock level; pressable squares in input mode. */
export function LevelBars({
  level = 0,
  max = 5,
  color = 'lime',
  size = 10,
  onChange,
  label,
  testID,
}: LevelBarsProps) {
  const filled = Math.round(level);
  const p = palette[color];
  const groupLabel = label ?? `Level ${filled} of ${max}`;
  const cells = Array.from({ length: max }, (_, i) => i);

  if (onChange) {
    const gap = 8;
    // Grow each square's touch area to 44pt vertically without overlapping its neighbours.
    const vSlop = Math.max(0, Math.ceil((minTouch - size) / 2));
    const hSlop = size >= minTouch ? 0 : gap / 2;
    return (
      <View style={[styles.row, { gap }]} accessibilityLabel={groupLabel} testID={testID}>
        {cells.map((i) => (
          <PressableScale
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Level ${i + 1} of ${max}`}
            accessibilityState={{ selected: i < filled }}
            onPress={() => onChange(i + 1)}
            pressedScale={0.94}
            hitSlop={{ top: vSlop, bottom: vSlop, left: hSlop, right: hSlop }}
            style={[
              { width: size, height: size, borderRadius: 12 },
              { backgroundColor: i < filled ? p.on : p.off },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[styles.row, { gap: 4 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={groupLabel}
      testID={testID}
    >
      {cells.map((i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: 2,
            backgroundColor: i < filled ? p.on : p.off,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
});
