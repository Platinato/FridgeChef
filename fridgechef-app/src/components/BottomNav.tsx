import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { colors, motion, radii, shadow } from '@/theme/tokens';

export type NavTab = 'home' | 'scan' | 'pantry' | 'saved';

export const NAV_TABS: { id: NavTab; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'scan', icon: 'camera', label: 'Scan' },
  { id: 'pantry', icon: 'pantry', label: 'Pantry' },
  { id: 'saved', icon: 'bookmark', label: 'Saved' },
];

/** Distance of the floating pill from the bottom edge (26pt on a 34pt home-indicator phone). */
export const navBottomOffset = (bottomInset: number) => (bottomInset > 0 ? bottomInset - 8 : 16);

export type BottomNavProps = {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
  /**
   * Float over the screen, centred above the home indicator (default). `false` renders the
   * pill in normal flow (dev gallery).
   */
  floating?: boolean;
};

/**
 * The floating black pill; the active tab is a wide lime pill. Pure, so Sprint 06 can hand it
 * to Expo Router `Tabs` as a custom `tabBar`.
 */
export function BottomNav({ active, onNavigate, floating = true }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const pill = (
    <View style={styles.pill} accessibilityRole="tablist" accessibilityLabel="Main">
      {NAV_TABS.map((t) => (
        <NavItem key={t.id} {...t} on={t.id === active} onPress={() => onNavigate(t.id)} />
      ))}
    </View>
  );
  if (!floating) return pill;
  return <View style={[styles.float, { bottom: navBottomOffset(insets.bottom) }]}>{pill}</View>;
}

function NavItem({
  label,
  icon,
  on,
  onPress,
}: {
  label: string;
  icon: IconName;
  on: boolean;
  onPress: () => void;
}) {
  const width = useSharedValue(on ? 96 : 52);
  useEffect(() => {
    width.set(
      withTiming(on ? 96 : 52, {
        duration: motion.duration,
        easing: Easing.bezier(...motion.easing),
      }),
    );
  }, [on, width]);
  const widthStyle = useAnimatedStyle(() => ({ width: width.get() }));

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.item, on && styles.itemOn, widthStyle]}
    >
      <Icon name={icon} size={22} color={on ? colors.ink : colors.white} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.navBg,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.float,
  },
  item: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemOn: { backgroundColor: colors.lime, borderColor: colors.lime },
});
