import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LevelBars } from '@/components/LevelBars';
import { PressableScale } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, radii } from '@/theme/tokens';

export type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
  /** Shows LevelBars (e.g. the Mood screen's effort control). Profile's "Default effort" omits it. */
  level?: number;
};

export type SegmentedControlProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  /** Tall segments with the bars above the label. */
  stacked?: boolean;
  /** Compact, content-width variant. */
  size?: 'md' | 'sm';
  /** Accessibility label for the group. */
  label?: string;
  testID?: string;
};

/** Pill segments; the active one is lime. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  stacked = false,
  size = 'md',
  label,
  testID,
}: SegmentedControlProps<T>) {
  const sm = size === 'sm';
  return (
    <View
      style={[styles.group, stacked && styles.groupStacked, sm && styles.groupSm]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      testID={testID}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <PressableScale
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on, checked: on }}
            onPress={() => onChange?.(o.value)}
            hitSlop={sm ? { top: 5, bottom: 5 } : undefined}
            style={[
              styles.opt,
              // Equal-width segments, except `sm`, which hugs its labels (CSS `flex: none`).
              !sm && styles.optFill,
              stacked && styles.optStacked,
              sm && styles.optSm,
              on && styles.optActive,
            ]}
          >
            {o.level != null ? (
              <LevelBars level={o.level} size={7} color={on ? 'ink' : 'white'} />
            ) : null}
            <AppText
              numberOfLines={1}
              style={[styles.text, sm && styles.textSm, { color: on ? colors.ink : colors.text2 }]}
            >
              {o.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupStacked: { borderRadius: 24 },
  groupSm: { alignSelf: 'flex-start', padding: 3, gap: 2 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  optFill: { flex: 1 },
  optStacked: { flexDirection: 'column', minHeight: 76, borderRadius: 19, gap: 10 },
  optSm: { minHeight: 34, paddingHorizontal: 12 },
  optActive: { backgroundColor: colors.lime },
  text: { fontFamily: bodyFont(600), fontSize: 14, lineHeight: 18 },
  textSm: { fontSize: 12, lineHeight: 16 },
});
