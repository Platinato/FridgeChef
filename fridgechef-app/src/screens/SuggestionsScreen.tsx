import { router, useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipRow } from '@/components/ChipRow';
import { Disc } from '@/components/Disc';
import { EmptyState } from '@/components/EmptyState';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { ListRow } from '@/components/ListRow';
import { LiveBadge } from '@/components/LiveBadge';
import { QueryState } from '@/components/QueryState';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { plural } from '@/domain/format';
import { rankSuggestions } from '@/domain/suggestions';
import type { Preferences } from '@/domain/types';
import { useCatalog, useSuggestions } from '@/services/queries';
import { selectPreferences, useKitchen, usePrefsStore, useProfileStore } from '@/state';
import { EFFORT_OPTIONS, FILTER_OPTIONS, SORT_OPTIONS } from '@/screens/shared';
import { spacing } from '@/theme/tokens';

const toMood = () => (router.canGoBack() ? router.back() : router.replace('/mood'));

/**
 * For you / TONIGHT (mockup screen 7). The backend proposes recipes for the confirmed kitchen +
 * preferences (`useSuggestions`); match %, the filter chip and the sort run on-device
 * (`rankSuggestions`), so changing them never refetches.
 */
export function SuggestionsScreen() {
  const kitchen = useKitchen();
  const store = usePrefsStore((s) => s);
  const allergies = useProfileStore((s) => s.profile.allergies);
  const catalog = useCatalog();
  const [sorting, setSorting] = useState(false);

  const prefs: Preferences = useMemo(() => selectPreferences(store), [store]);
  const input = useMemo(
    () => ({ kitchen, prefs, profile: { allergies } }),
    [kitchen, prefs, allergies],
  );
  // The request follows the kitchen + prefs only while this screen is focused. Under Recipe /
  // Cook, "Update pantry" changes the kitchen; the backend shouldn't be asked again for a list
  // that's about to be popped, and an iOS swipe-back must still reveal the list (not an empty
  // state), so the last focused request is kept, and its cached result shown. (Adjusting state
  // during render, as in PantryScreen.)
  const focused = useIsFocused();
  const [request, setRequest] = useState(input);
  if (focused && request !== input) setRequest(input);
  const suggestions = useSuggestions(request);
  const ranked = useMemo(
    () => rankSuggestions(suggestions.data ?? [], { kitchen, prefs, allergies }),
    [suggestions.data, kitchen, prefs, allergies],
  );

  const mood = catalog.data?.moods.find((m) => m.id === prefs.mood);
  const effort = EFFORT_OPTIONS.find((e) => e.value === prefs.effort);
  const context = `${mood?.label ?? 'Any mood'} · ${prefs.timeMin} min · ${effort?.label ?? ''} · ${plural(prefs.servings, 'serving')}`;
  const ready = !suggestions.isLoading && !suggestions.errorMessage;

  return (
    <Screen
      testID="suggestions-screen"
      overlay={
        <Sheet open={sorting} onClose={() => setSorting(false)} title="Sort by">
          <View style={styles.stack}>
            {SORT_OPTIONS.map((s) => (
              <ListRow
                key={s.value}
                label={s.label}
                onPress={() => {
                  void store.setSort(s.value);
                  setSorting(false);
                }}
                right={
                  prefs.sort === s.value ? (
                    <Disc icon="check" size={28} variant="lime" ring={false} />
                  ) : undefined
                }
              />
            ))}
          </View>
        </Sheet>
      }
    >
      <TopBar
        left={<IconButton icon="back" label="Back" onPress={toMood} />}
        center={
          ready ? (
            <LiveBadge label={`${ranked.length} ${ranked.length === 1 ? 'match' : 'matches'}`} />
          ) : null
        }
        right={<IconButton icon="sort" label="Sort" onPress={() => setSorting(true)} />}
      />
      <HeroTitle kicker="For you" title="Tonight" />
      <ListRow label={context} detail="Edit" icon="edit" onPress={toMood} />
      <ChipRow
        chips={FILTER_OPTIONS.map((f) => ({
          key: f.value,
          label: f.label,
          active: prefs.filter === f.value,
          onPress: () => void store.setFilter(f.value),
        }))}
      />

      <QueryState
        loading={suggestions.isLoading}
        errorMessage={suggestions.errorMessage}
        onRetry={suggestions.refetch}
        blocks={3}
        blockHeight={260}
        errorTitle="Couldn't load recipes"
      >
        {ranked.length > 0 ? (
          <View style={styles.cards}>
            {ranked.map((x, i) => (
              <RecipeCard
                key={x.recipe.id}
                recipe={x.recipe}
                match={x.match}
                variant={i % 2 ? 'light' : 'lime'}
                onPress={() =>
                  router.push({ pathname: '/recipe/[id]', params: { id: x.recipe.id } })
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="search"
            title="No matches"
            body="Nothing fits all of that right now. Loosen a filter or give yourself a bit more time."
            actions={[
              {
                key: 'loosen',
                label: 'Loosen filters',
                variant: 'lime',
                onPress: () => {
                  void store.loosenFilters();
                  showToast('Filters loosened');
                },
              },
              {
                key: 'time',
                label: 'Add 30 min',
                variant: 'outline',
                onPress: () => {
                  const next = Math.min(120, prefs.timeMin + 30);
                  void store.addTime();
                  showToast(`Now ${next} min`);
                },
              },
            ]}
          />
        )}
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[2] },
  cards: { gap: spacing[5] },
});
