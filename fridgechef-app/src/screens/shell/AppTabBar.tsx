import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { BottomNav, type NavTab } from '@/components/BottomNav';

/** Tab route name (file in `src/app/(tabs)/`) → BottomNav tab. */
const ROUTE_TABS: Record<string, NavTab> = { index: 'home', pantry: 'pantry', saved: 'saved' };

/**
 * The `tabBar` for the (tabs) navigator: the mockup's floating BottomNav. "Scan" isn't a tab:
 * it pushes the full-screen `/scan` stack route, which has no nav (as in the mockup).
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const current = state.routes[state.index];
  const active = (current && ROUTE_TABS[current.name]) ?? 'home';

  const onNavigate = (tab: NavTab) => {
    if (tab === 'scan') {
      router.push('/scan');
      return;
    }
    const route = state.routes.find((r) => ROUTE_TABS[r.name] === tab);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (route.key !== current?.key && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return <BottomNav active={active} onNavigate={onNavigate} />;
}
