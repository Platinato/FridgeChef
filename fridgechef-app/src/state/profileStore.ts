import { createStore } from 'zustand/vanilla';

import { getDb } from '@/db/client';
import { metaRepo, profileRepo } from '@/db/repositories';
import { DEFAULT_PROFILE, toggleIn } from '@/domain/preferences';
import type { DietPref, EffortPref, Profile, UnitSystem } from '@/domain/types';

import { nowIso, writeThrough } from './persist';
import type { AppStores } from './types';

export type ProfileState = {
  hydrated: boolean;
  onboarded: boolean;
  profile: Profile;

  hydrate(): Promise<void>;
  setName(name: string): Promise<boolean>;
  /** Also sets the Mood screen diet (the mockup's `set-diet`). */
  setDiet(diet: DietPref): Promise<boolean>;
  toggleAllergy(allergy: string): Promise<boolean>;
  /** Also sets servings (the mockup's `set-household`). */
  setHousehold(size: number): Promise<boolean>;
  setUnits(units: UnitSystem): Promise<boolean>;
  /** Also sets the Mood screen effort. */
  setDefaultEffort(effort: EffortPref): Promise<boolean>;
  /** Finishes onboarding; carries diet + household size into the preferences. */
  completeOnboarding(): Promise<boolean>;
  /** Profile → "Replay onboarding". */
  replayOnboarding(): Promise<boolean>;
};

const all = async (writes: Promise<boolean>[]) => (await Promise.all(writes)).every(Boolean);

export const createProfileStore = (app: () => AppStores) =>
  createStore<ProfileState>()((set, get) => {
    const saveProfile = (patch: Partial<Profile>) => {
      const profile = { ...get().profile, ...patch };
      set({ profile });
      return writeThrough('profile.save', (db) => profileRepo.save(db, profile, nowIso()));
    };
    const setOnboarded = (onboarded: boolean) => {
      set({ onboarded });
      return writeThrough('profile.onboarded', (db) => metaRepo.setOnboarded(db, onboarded));
    };
    const prefs = () => app().prefs.getState();

    return {
      hydrated: false,
      onboarded: false,
      profile: DEFAULT_PROFILE,

      async hydrate() {
        const db = getDb();
        const [profile, onboarded] = await Promise.all([
          profileRepo.get(db),
          metaRepo.getOnboarded(db),
        ]);
        set({ hydrated: true, onboarded, profile: profile ?? DEFAULT_PROFILE });
      },

      setName: (name) => saveProfile({ name }),
      setDiet: (diet) => all([saveProfile({ diet }), prefs().update({ diet })]),
      toggleAllergy: (allergy) =>
        saveProfile({ allergies: toggleIn(get().profile.allergies, allergy) }),
      setHousehold: (size) =>
        all([saveProfile({ householdSize: size }), prefs().update({ servings: size })]),
      setUnits: (units) => saveProfile({ units }),
      setDefaultEffort: (effort) =>
        all([saveProfile({ defaultEffort: effort }), prefs().update({ effort })]),
      completeOnboarding: () => {
        const { diet, householdSize } = get().profile;
        return all([setOnboarded(true), prefs().update({ diet, servings: householdSize })]);
      },
      replayOnboarding: () => setOnboarded(false),
    };
  });
