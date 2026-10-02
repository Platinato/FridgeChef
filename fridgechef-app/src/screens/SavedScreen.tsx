import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { EmptyState } from '@/components/EmptyState';
import { FormSection } from '@/components/FormSection';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { ListRow } from '@/components/ListRow';
import { QueryState } from '@/components/QueryState';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import type { Recipe } from '@/domain/types';
import { useCatalog, useResetDemoData } from '@/services/queries';
import { useCookbookStore, useProfileStore } from '@/state';
import { confirmDestructive } from '@/screens/confirm';
import {
  EFFORT_OPTIONS,
  HOUSEHOLD_MAX,
  HOUSEHOLD_MIN,
  UNIT_OPTIONS,
  dietOptions,
} from '@/screens/shared';
import { spacing } from '@/theme/tokens';

type ProfileSheet = 'diet' | 'allergies' | null;

/** Saved / Profile: "My / COOKBOOK" (mockup screen 11). */
export function SavedScreen() {
  const catalog = useCatalog();
  const saved = useCookbookStore((s) => s.saved);
  const snapshots = useCookbookStore((s) => s.snapshots);
  const profile = useProfileStore((s) => s.profile);
  const { setHousehold, setDefaultEffort, setUnits, replayOnboarding } = useProfileStore((s) => s);
  const resetDemoData = useResetDemoData();
  const [sheet, setSheet] = useState<ProfileSheet>(null);

  const recipes = useMemo(
    () => saved.map((id) => snapshots[id]).filter((r): r is Recipe => !!r),
    [saved, snapshots],
  );
  const dietLabel =
    dietOptions(catalog.data?.diets).find((d) => d.id === profile.diet)?.label ?? 'None';
  const name = profile.name.trim();

  const confirmReset = () =>
    confirmDestructive({
      title: 'Reset demo data?',
      message: 'Your pantry, saved recipes and settings go back to the demo.',
      confirmLabel: 'Reset',
      onConfirm: async () => {
        await resetDemoData();
        showToast('Demo data reset');
      },
    });

  return (
    <Screen
      withNav
      overlay={
        <>
          <DietSheet open={sheet === 'diet'} onClose={() => setSheet(null)} />
          <AllergiesSheet open={sheet === 'allergies'} onClose={() => setSheet(null)} />
        </>
      }
    >
      <TopBar
        left={<AppLogo size={50} />}
        right={
          <IconButton
            icon="user"
            label={name ? `Signed in as ${name}` : 'Profile'}
            onPress={() => showToast(name ? `Hi ${name}!` : 'Hi there!')}
          />
        }
      />
      <HeroTitle kicker="My" title="Cookbook" />

      <SectionHeader title="Saved recipes" count={recipes.length} />
      {recipes.length > 0 ? (
        <View style={styles.cards}>
          {recipes.map((r, i) => (
            // Content rule: saved cards show effort, not match %.
            <RecipeCard
              key={r.id}
              compact
              stat="effort"
              recipe={r}
              variant={i % 2 ? 'lime' : 'light'}
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="heart"
          title="Nothing saved"
          body="Tap the heart on any recipe to keep it here."
          actions={[
            { label: 'Find recipes', variant: 'lime', onPress: () => router.push('/scan') },
          ]}
        />
      )}

      <SectionHeader title="Profile" />
      <View style={styles.stack}>
        <ListRow icon="leaf" label="Diet" detail={dietLabel} onPress={() => setSheet('diet')} />
        <ListRow
          icon="alert"
          label="Allergies"
          detail={profile.allergies.join(', ') || 'None'}
          onPress={() => setSheet('allergies')}
        />
        <ListRow
          icon="user"
          label="Household"
          right={
            <Stepper
              value={profile.householdSize}
              min={HOUSEHOLD_MIN}
              max={HOUSEHOLD_MAX}
              label="Household size"
              onChange={setHousehold}
            />
          }
        />
      </View>
      {/* Content rule: a plain segmented control here, no level bars. */}
      <FormSection title="Default effort">
        <SegmentedControl
          label="Default effort"
          options={EFFORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={profile.defaultEffort}
          onChange={setDefaultEffort}
        />
      </FormSection>
      <FormSection divider title="Units">
        <SegmentedControl
          label="Units"
          options={UNIT_OPTIONS}
          value={profile.units}
          onChange={setUnits}
        />
      </FormSection>
      <View style={styles.stack}>
        <ListRow icon="flip" label="Replay onboarding" onPress={() => void replayOnboarding()} />
        <ListRow icon="trash" label="Reset demo data" danger onPress={confirmReset} />
      </View>
    </Screen>
  );
}

function DietSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catalog = useCatalog();
  const diet = useProfileStore((s) => s.profile.diet);
  const setDiet = useProfileStore((s) => s.setDiet);
  return (
    <Sheet open={open} onClose={onClose} title="Diet">
      <QueryState
        loading={catalog.isLoading}
        errorMessage={catalog.errorMessage}
        onRetry={catalog.refetch}
        placeholder="chips"
      >
        <ChipRow
          wrap
          chips={dietOptions(catalog.data?.diets).map((d) => ({
            key: d.id,
            label: d.label,
            active: diet === d.id,
            onPress: () => setDiet(d.id),
          }))}
        />
      </QueryState>
    </Sheet>
  );
}

function AllergiesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catalog = useCatalog();
  const allergies = useProfileStore((s) => s.profile.allergies);
  const toggleAllergy = useProfileStore((s) => s.toggleAllergy);
  return (
    <Sheet open={open} onClose={onClose} title="Allergies">
      <View style={styles.sheetBody}>
        <AppText variant="caption">Recipes containing these are never suggested.</AppText>
        <QueryState
          loading={catalog.isLoading}
          errorMessage={catalog.errorMessage}
          onRetry={catalog.refetch}
          placeholder="chips"
        >
          <ChipRow
            wrap
            chips={(catalog.data?.allergies ?? []).map((a) => {
              const on = allergies.includes(a);
              return {
                key: a,
                label: a,
                active: on,
                icon: on ? 'check' : undefined,
                onPress: () => toggleAllergy(a),
              };
            })}
          />
        </QueryState>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 14 },
  stack: { gap: spacing[2] },
  sheetBody: { gap: spacing[3] },
});
