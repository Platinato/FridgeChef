import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/screens/shell/AppTabBar';
import { useProfileStore } from '@/state';
import { colors } from '@/theme/tokens';

/** Home / Pantry / Saved with the mockup's floating BottomNav. Not onboarded yet → onboarding. */
export default function TabsLayout() {
  const onboarded = useProfileStore((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="pantry" options={{ title: 'Pantry' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}
