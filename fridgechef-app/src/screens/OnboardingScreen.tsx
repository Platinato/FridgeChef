import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { FormSection } from '@/components/FormSection';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { PaginationDots } from '@/components/PaginationDots';
import { HeroFadeContinuation, PhotoHero } from '@/components/PhotoHero';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { useCatalog } from '@/services/queries';
import { useProfileStore } from '@/state';
import { HOUSEHOLD_MAX, HOUSEHOLD_MIN, ONBOARDING_SLIDES, dietOptions } from '@/screens/shared';

const SLIDES = ONBOARDING_SLIDES.length;

/** Onboarding: 3 photo slides (Snap / Confirm / Cook), then the taste setup (mockup screen 1). */
export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const dots = <PaginationDots count={SLIDES + 1} active={step} />;

  if (step < SLIDES) {
    const slide = ONBOARDING_SLIDES[step]!;
    const last = step === SLIDES - 1;
    return (
      <Screen
        flush
        footer={
          <PrimaryButton
            label={last ? 'Set up my kitchen' : 'Next'}
            variant="lime"
            iconRight="chevronRight"
            onPress={() => setStep(step + 1)}
          />
        }
      >
        <PhotoHero uri={slide.image} alt={slide.title} height={500}>
          <TopBar
            left={<AppLogo size={44} />}
            right={
              <PrimaryButton
                label="Skip"
                variant="glass"
                size="xs"
                full={false}
                onPress={() => setStep(SLIDES)}
              />
            }
          />
        </PhotoHero>
        <HeroFadeContinuation gap={14}>
          {dots}
          <HeroTitle kicker={slide.kicker} title={slide.title} size={96} />
          <AppText variant="body">{slide.body}</AppText>
        </HeroFadeContinuation>
      </Screen>
    );
  }

  return <TasteSetup dots={dots} onBack={() => setStep(SLIDES - 1)} />;
}

function TasteSetup({ dots, onBack }: { dots: ReactNode; onBack: () => void }) {
  const catalog = useCatalog();
  const profile = useProfileStore((s) => s.profile);
  const { setDiet, toggleAllergy, setHousehold, completeOnboarding } = useProfileStore((s) => s);

  const finish = async () => {
    await completeOnboarding();
    router.replace('/');
    showToast('Welcome to FridgeChef');
  };

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Let's cook"
          variant="lime"
          iconRight="chevronRight"
          onPress={finish}
        />
      }
    >
      <TopBar left={<IconButton icon="back" label="Back" onPress={onBack} />} center={dots} />
      <HeroTitle kicker="Set up" title="Your taste" size={84} />
      <QueryState
        loading={catalog.isLoading}
        errorMessage={catalog.errorMessage}
        onRetry={catalog.refetch}
        blocks={2}
        blockHeight={120}
      >
        <FormSection title="Diet" hint="We only suggest recipes that fit.">
          <ChipRow
            wrap
            chips={dietOptions(catalog.data?.diets).map((d) => ({
              key: d.id,
              label: d.label,
              active: profile.diet === d.id,
              onPress: () => setDiet(d.id),
            }))}
          />
        </FormSection>
        <FormSection divider title="Allergies" hint="Recipes with these are never shown.">
          <ChipRow
            wrap
            chips={(catalog.data?.allergies ?? []).map((a) => {
              const on = profile.allergies.includes(a);
              return {
                key: a,
                label: a,
                active: on,
                icon: on ? 'check' : undefined,
                onPress: () => toggleAllergy(a),
              };
            })}
          />
        </FormSection>
      </QueryState>
      <FormSection
        divider
        title="Household"
        hint="Default servings for every recipe."
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
    </Screen>
  );
}
