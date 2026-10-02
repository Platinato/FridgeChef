import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { Disc } from '@/components/Disc';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { PantryItem } from '@/components/PantryItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { TicketCard } from '@/components/TicketCard';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { lastScanLabel, plural } from '@/domain/format';
import { match } from '@/domain/matching';
import { isLow } from '@/domain/pantry';
import type { Recipe } from '@/domain/types';
import { useCatalog } from '@/services/queries';
import { useCookbookStore, useKitchen, useLowStaples, usePrefsStore, useScanStore } from '@/state';
import { iconOr } from '@/screens/shared';
import { spacing } from '@/theme/tokens';

/** How many recently cooked recipes "Cook again" shows (the mockup's `slice(0, 2)`). */
const COOK_AGAIN = 2;

/** Home: "Explore / RECIPES" (mockup screen 2). */
export function HomeScreen() {
  const catalog = useCatalog();
  const mood = usePrefsStore((s) => s.mood);
  const setMood = usePrefsStore((s) => s.setMood);
  const servings = usePrefsStore((s) => s.servings);
  const lastScan = useScanStore((s) => s.lastScan);
  const low = useLowStaples();
  const kitchen = useKitchen();
  const cooked = useCookbookStore((s) => s.cooked);
  const snapshots = useCookbookStore((s) => s.snapshots);

  const recent = useMemo(
    () =>
      cooked
        .map((id) => snapshots[id])
        .filter((r): r is Recipe => !!r)
        .slice(0, COOK_AGAIN),
    [cooked, snapshots],
  );

  return (
    <Screen withNav>
      <TopBar
        left={
          // Dev builds: long-press the logo for the component gallery.
          <Pressable
            accessibilityRole="image"
            accessibilityLabel="FridgeChef"
            onLongPress={__DEV__ ? () => router.push('/dev/gallery') : undefined}
          >
            <AppLogo size={50} />
          </Pressable>
        }
        right={
          <View style={styles.actions}>
            <IconButton
              icon="search"
              label="Search recipes"
              onPress={() => showToast('Coming soon')}
            />
            <IconButton
              icon="bell"
              label="Notifications"
              badge={low.length > 0}
              onPress={() => showToast(`${plural(low.length, 'staple')} running low`)}
            />
          </View>
        }
      />
      <HeroTitle kicker="Explore" title="Recipes" />

      <QueryState
        loading={catalog.isLoading}
        errorMessage={catalog.errorMessage}
        onRetry={catalog.refetch}
        placeholder="chips"
        errorTitle="Couldn't load moods"
      >
        <ChipRow
          chips={(catalog.data?.moods ?? []).map((m) => ({
            key: m.id,
            label: m.label,
            icon: iconOr(m.icon, 'bowl'),
            active: mood === m.id,
            onPress: () => setMood(m.id),
          }))}
        />
      </QueryState>

      {/* Not a pressable card: its two controls are the actions (nested buttons break VoiceOver / web). */}
      <TicketCard
        variant="lime"
        bottomVariant="white"
        top={
          <View style={styles.scanTop}>
            <AppText variant="display" size={42} color="ink" style={styles.scanTitle}>
              {"What's in\nyour kitchen?"}
            </AppText>
            <Disc
              icon="camera"
              size={64}
              accessibilityLabel="Scan your kitchen"
              onPress={() => router.push('/scan')}
            />
          </View>
        }
        bottom={
          <View style={styles.scanBottom}>
            <View style={styles.lastScan}>
              <AppText variant="micro" color="ink">
                Last scan
              </AppText>
              <AppText variant="display" size={22} color="ink">
                {lastScan ? lastScanLabel(lastScan) : 'No scans yet'}
              </AppText>
            </View>
            <PrimaryButton
              label="Scan now"
              variant="black"
              size="sm"
              full={false}
              onPress={() => router.push('/scan')}
            />
          </View>
        }
      />

      {low.length > 0 ? (
        <>
          <SectionHeader
            title="Running low"
            dot
            count={low.length}
            actionLabel="See all"
            onAction={() => router.navigate('/pantry')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.lowScroll}
            contentContainerStyle={styles.lowList}
          >
            {low.map((s) => (
              <PantryItem
                key={s.id}
                variant="card"
                item={s}
                low={isLow(s)}
                onPress={() => router.navigate({ pathname: '/pantry', params: { staple: s.id } })}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {recent.length > 0 ? (
        <>
          <SectionHeader
            title="Cook again"
            actionLabel="Saved"
            onAction={() => router.navigate('/saved')}
          />
          <View style={styles.cards}>
            {recent.map((r, i) => (
              <RecipeCard
                key={r.id}
                compact
                recipe={r}
                match={match(r, kitchen, servings)}
                variant={i % 2 ? 'lime' : 'light'}
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing[2] },
  scanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    minHeight: 96,
  },
  scanTitle: { flexShrink: 1 },
  scanBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  lastScan: { flexShrink: 1, gap: spacing[1] },
  lowScroll: { marginRight: -spacing.gutter },
  lowList: { gap: 10, paddingRight: spacing.gutter },
  cards: { gap: 14 },
});
