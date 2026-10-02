import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, radii } from '@/theme/tokens';

export type TabBarTab<T extends string> = { id: T; label: string };

export type TabBarProps<T extends string> = {
  tabs: TabBarTab<T>[];
  active: T;
  onChange?: (id: T) => void;
  testID?: string;
};

/** Dark rounded container of pill tabs; the active tab is lime (recipe detail tabs). */
export function TabBar<T extends string>({ tabs, active, onChange, testID }: TabBarProps<T>) {
  return (
    <View style={styles.bar} accessibilityRole="tablist" testID={testID}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <PressableScale
            key={t.id}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange?.(t.id)}
            style={[styles.tab, on && styles.tabActive]}
          >
            <AppText
              numberOfLines={1}
              style={[
                styles.text,
                { color: on ? colors.ink : colors.tabText, fontFamily: bodyFont(on ? 600 : 500) },
              ]}
            >
              {t.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    // CSS flex items never shrink below their content (min-width: auto); Yoga has no such
    // clamp, so grow from the content width instead of from 0 to avoid truncated labels.
    flexGrow: 1,
    flexBasis: 'auto',
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
  },
  tabActive: { backgroundColor: colors.lime },
  text: { fontSize: 14, lineHeight: 18 },
});
