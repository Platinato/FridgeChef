import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FormSection } from '@/components/FormSection';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { IngredientRow } from '@/components/IngredientRow';
import { HeroFadeContinuation, PhotoHero } from '@/components/PhotoHero';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { StatTileRow } from '@/components/StatTileRow';
import { StepTimeline } from '@/components/StepTimeline';
import { Stepper } from '@/components/Stepper';
import { TabBar } from '@/components/TabBar';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { effortLabel, fmtQty } from '@/domain/format';
import { match } from '@/domain/matching';
import type { MatchRow, Recipe } from '@/domain/types';
import { useRecipe } from '@/services/queries';
import { useCookbookStore, useKitchen, usePrefsStore } from '@/state';
import { HOUSEHOLD_MAX, HOUSEHOLD_MIN, NUTRITION_MAX } from '@/screens/shared';
import { spacing } from '@/theme/tokens';

type Tab = 'ingredients' | 'steps' | 'nutrition' | 'swaps';
const TABS: { id: Tab; label: string }[] = [
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'steps', label: 'Steps' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'swaps', label: 'Swaps' },
];

const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

/**
 * Recipe detail (mockup screen 8). Shows a known copy at once (suggestions cache → cookbook
 * snapshot, via `useRecipe`), then refreshes it. Content rules: the hero has only back + save
 * (no time / match pills, no play button), the stat tiles are time / kcal / protein, and
 * "Start cooking" is text only.
 */
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);

  if (!recipe.data) {
    return (
      <Screen testID="recipe-screen">
        <TopBar left={<IconButton icon="back" label="Back" onPress={back} />} />
        <QueryState
          loading={recipe.isLoading}
          errorMessage={recipe.errorMessage}
          onRetry={recipe.refetch}
          blocks={4}
          blockHeight={90}
          errorTitle="Couldn't load this recipe"
        >
          {null}
        </QueryState>
      </Screen>
    );
  }
  return <RecipeDetail recipe={recipe.data} />;
}

function RecipeDetail({ recipe: r }: { recipe: Recipe }) {
  const kitchen = useKitchen();
  const servings = usePrefsStore((s) => s.servings);
  const setServings = usePrefsStore((s) => s.setServings);
  const saved = useCookbookStore((s) => s.saved.includes(r.id));
  const toggleSave = useCookbookStore((s) => s.toggleSave);
  const [tab, setTab] = useState<Tab>('ingredients');
  const m = match(r, kitchen, servings);

  const save = () => {
    void toggleSave(r);
    showToast(saved ? 'Removed from saved' : 'Saved to your cookbook');
  };

  return (
    <Screen
      flush
      testID="recipe-screen"
      footerVariant="lime"
      footer={
        <PrimaryButton
          label="Start cooking"
          variant="black"
          onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id } })}
        />
      }
    >
      <PhotoHero uri={r.image} alt={r.name} height={470}>
        <TopBar
          left={<IconButton icon="back" label="Back" variant="glass" onPress={back} />}
          right={
            <IconButton
              icon={saved ? 'heartFill' : 'heart'}
              label={saved ? 'Remove from saved' : 'Save recipe'}
              variant={saved ? 'lime' : 'glass'}
              onPress={save}
            />
          }
        />
        <View style={styles.title}>
          <AppText variant="display" size={62} accessibilityRole="header" style={styles.name}>
            {r.name}
          </AppText>
          <AppText color="text" style={styles.meta}>
            {`${r.cuisine} · ${effortLabel(r.effort)} · Serves ${servings}`}
          </AppText>
        </View>
      </PhotoHero>
      <HeroFadeContinuation>
        <StatTileRow
          tiles={[
            { value: String(r.timeMin), caption: 'min', variant: 'lime' },
            { value: String(r.nutrition.kcal), caption: 'kcal', variant: 'white' },
            { value: `${r.nutrition.protein}g`, caption: 'protein', variant: 'soft' },
          ]}
        />
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <View style={styles.pane}>
          {tab === 'ingredients' ? (
            <>
              <FormSection
                title={`${m.have} of ${m.total} in your kitchen`}
                right={
                  <Stepper
                    value={servings}
                    min={HOUSEHOLD_MIN}
                    max={HOUSEHOLD_MAX}
                    unit="ppl"
                    label="Servings"
                    onChange={(v) => void setServings(v)}
                  />
                }
              />
              <View>
                {m.rows.map((row, i) => (
                  <IngredientRow
                    key={row.id}
                    name={row.name}
                    qty={fmtQty(row.need, row.unit)}
                    status={row.status}
                    thumb={row.imageUrl}
                    note={ingredientNote(row, r)}
                    last={i === m.rows.length - 1}
                  />
                ))}
              </View>
            </>
          ) : null}
          {tab === 'steps' ? <StepTimeline steps={r.steps} /> : null}
          {tab === 'nutrition' ? (
            <>
              <FormSection
                title="Per serving"
                hint={`${r.nutrition.kcal} kcal · macros vs. a typical meal`}
              />
              <ProgressBar
                label="Protein"
                caption={`${r.nutrition.protein} g`}
                value={r.nutrition.protein}
                max={NUTRITION_MAX.protein}
              />
              <ProgressBar
                label="Carbs"
                caption={`${r.nutrition.carbs} g`}
                value={r.nutrition.carbs}
                max={NUTRITION_MAX.carbs}
                variant="soft"
              />
              <ProgressBar
                label="Fat"
                caption={`${r.nutrition.fat} g`}
                value={r.nutrition.fat}
                max={NUTRITION_MAX.fat}
                variant="white"
              />
            </>
          ) : null}
          {tab === 'swaps' ? (
            r.swaps.length ? (
              r.swaps.map((s) => (
                <InfoCard
                  key={s.missing}
                  icon="swap"
                  title={`No ${s.missing.toLowerCase()}?`}
                  body={s.use}
                />
              ))
            ) : (
              <EmptyState
                icon="check"
                title="No swaps needed"
                body="You have everything this one needs."
              />
            )
          ) : null}
        </View>
      </HeroFadeContinuation>
    </Screen>
  );
}

/** The grey line under an ingredient (mockup RecipeDetail): pantry state, what you have, or a swap. */
export function ingredientNote(row: MatchRow, r: Recipe): string {
  if (row.kind === 'staple') return row.status === 'pantry' ? 'From your pantry' : 'Not in pantry';
  if (row.kind === 'detected') return `You have ${fmtQty(row.have ?? 0, row.unit)}`;
  const swap = r.swaps.find((s) => s.missing.toLowerCase() === row.name.toLowerCase());
  return swap?.use ?? 'Not in your kitchen';
}

const styles = StyleSheet.create({
  title: { marginTop: 'auto', gap: spacing[2] },
  name: { lineHeight: 54 },
  meta: { fontSize: 14, lineHeight: 18 },
  pane: { gap: spacing[5] },
});
