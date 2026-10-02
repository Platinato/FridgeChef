import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { ChipRow } from '@/components/ChipRow';
import { FormSection } from '@/components/FormSection';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { LevelBars } from '@/components/LevelBars';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { RangeSlider } from '@/components/RangeSlider';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { TopBar } from '@/components/TopBar';
import { MAX_TIME_MIN } from '@/domain/preferences';
import { useCatalog } from '@/services/queries';
import { usePrefsStore, useScanStore } from '@/state';
import {
  EFFORT_OPTIONS,
  HOUSEHOLD_MAX,
  HOUSEHOLD_MIN,
  HUNGER_OPTIONS,
  TIME_MARKS,
  TIME_MIN,
  TIME_STEP,
  dietOptions,
  iconOr,
  spiceLabel,
} from '@/screens/shared';
import { spacing } from '@/theme/tokens';

const back = () => (router.canGoBack() ? router.back() : router.replace('/scan/confirm'));

/**
 * Your / MOOD (mockup screen 6): the human parameters, all bound to `prefsStore` (written
 * through to SQLite), with the option lists from the catalog. Needs a confirmed scan.
 */
export function MoodScreen() {
  const status = useScanStore((s) => s.status);
  const catalog = useCatalog();
  const p = usePrefsStore((s) => s);

  // A deep link (or a new detection) without a confirmed scan goes back through the gate.
  if (status !== 'confirmed') return <Redirect href="/scan/confirm" />;

  const effort = EFFORT_OPTIONS.find((e) => e.value === p.effort) ?? EFFORT_OPTIONS[1]!;
  const data = catalog.data;

  return (
    <Screen
      testID="mood-screen"
      footer={
        <PrimaryButton
          label="Cook up ideas"
          variant="lime"
          iconRight="sparkle"
          onPress={() => router.push('/suggestions')}
        />
      }
    >
      <TopBar
        left={<IconButton icon="back" label="Back" onPress={back} />}
        center={<Badge label="Quantities confirmed" icon="check" variant="dark" />}
      />
      <HeroTitle kicker="Your" title="Mood" />

      <FormSection title="How are you feeling?">
        <QueryState
          loading={catalog.isLoading}
          errorMessage={catalog.errorMessage}
          onRetry={catalog.refetch}
          placeholder="chips"
          errorTitle="Couldn't load moods"
        >
          <ChipRow
            chips={(data?.moods ?? []).map((m) => ({
              key: m.id,
              label: m.label,
              icon: iconOr(m.icon, 'bowl'),
              active: p.mood === m.id,
              onPress: () => void p.setMood(m.id),
            }))}
          />
        </QueryState>
      </FormSection>

      <FormSection divider title="Time you have">
        <RangeSlider
          min={TIME_MIN}
          max={MAX_TIME_MIN}
          step={TIME_STEP}
          value={p.timeMin}
          unit="min"
          marks={TIME_MARKS}
          label="Minutes available"
          onChange={(v) => void p.setTimeMin(v)}
        />
      </FormSection>

      <FormSection divider title="Effort" hint={effort.desc}>
        <SegmentedControl
          stacked
          label="Effort"
          value={p.effort}
          options={EFFORT_OPTIONS.map(({ value, label, level }) => ({ value, label, level }))}
          onChange={(v) => void p.setEffort(v)}
        />
      </FormSection>

      <FormSection
        divider
        title="Servings"
        hint="Recipes scale to this."
        right={
          <Stepper
            value={p.servings}
            min={HOUSEHOLD_MIN}
            max={HOUSEHOLD_MAX}
            label="Servings"
            onChange={(v) => void p.setServings(v)}
          />
        }
      />

      <FormSection divider title="Hunger">
        <SegmentedControl
          label="Hunger"
          value={p.hunger}
          options={HUNGER_OPTIONS}
          onChange={(v) => void p.setHunger(v)}
        />
      </FormSection>

      {data ? (
        <>
          <FormSection divider title="Cuisine" hint="Pick any - or leave it on Any.">
            <ChipRow
              wrap
              chips={data.cuisines.map((c) => ({
                key: c,
                label: c,
                size: 'sm',
                active: p.cuisines.includes(c),
                onPress: () => void p.toggleCuisine(c),
              }))}
            />
          </FormSection>

          <FormSection divider title="Diet">
            <ChipRow
              chips={dietOptions(data.diets).map((d) => ({
                key: d.id,
                label: d.label,
                active: p.diet === d.id,
                onPress: () => void p.setDiet(d.id),
              }))}
            />
          </FormSection>

          <FormSection divider title="Equipment" hint="What can you use right now?">
            <ChipRow
              wrap
              chips={data.equipment.map((e) => {
                const on = p.equipment.includes(e.id);
                return {
                  key: e.id,
                  label: e.label,
                  size: 'sm',
                  icon: on ? 'check' : 'plus',
                  active: on,
                  onPress: () => void p.toggleEquipment(e.id),
                };
              })}
            />
          </FormSection>
        </>
      ) : null}

      <FormSection
        divider
        title="Spice level"
        hint={spiceLabel(p.spice)}
        right={
          <View style={styles.spice}>
            <LevelBars
              level={p.spice}
              size={30}
              label={`Spice level ${p.spice} of 5`}
              onChange={(v) => void p.setSpice(Math.max(1, Math.round(v)))}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spice: { paddingTop: spacing[1] },
});
