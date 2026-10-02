/**
 * Sprint 08 flows on the real routes: Mood → Suggestions → Recipe detail → Cook mode → pantry
 * update → Home. Same harness as scan-flow.test.tsx (real SQL on the Node driver, MockApi with
 * no latency), with the mock seed's 3-photo detection confirmed as the kitchen.
 */
import * as Haptics from 'expo-haptics';
import {
  act,
  cleanup,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import { router } from 'expo-router';

import { initDatabase } from '@/db/bootstrap';
import { openDatabaseByName, setDatabaseForTests } from '@/db/client';
import { metaRepo, pantryRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { rankSuggestions } from '@/domain/suggestions';
import { setApiForTests, type FridgeChefApi } from '@/services/api';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { appQueryClient } from '@/services/queries';
import { appStores, flushWrites, hydrateStores, selectKitchen, selectPreferences } from '@/state';
import { createMockDb, fastMockApi } from '@/testing/apiHelpers';
import { MOCKUP_RECIPES, recipeById } from '@/testing/mockupData';

jest.setTimeout(60_000);

jest.mock('react-native-reanimated/mock', () => jest.requireActual('react-native-reanimated'));
jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

let db: NodeDriver;
let mockDb: NodeDriver;
let api: FridgeChefApi;
let app: ReturnType<typeof renderRouter>;

async function renderApp(initialUrl: string) {
  app = renderRouter('./src/app', { initialUrl });
  await app;
}
const pathname = () => app.getPathname();
const button = (name: string | RegExp) => screen.getByRole('button', { name });

/** The mockup's default state: 3 photos detected, every item checked, the scan confirmed. */
async function confirmDefaultScan() {
  const scan = appStores.scan.getState();
  await scan.addPhotos([0, 1, 2].map((i) => ({ uri: `file:///p${i}.jpg`, label: 'Camera' })));
  const seedApi = fastMockApi(mockDb, { sleep: async () => undefined });
  const result = await seedApi.detectIngredients({
    images: [0, 1, 2].map((i) => ({ id: `ph${i}`, mimeType: 'image/jpeg', base64: 'A' })),
    knownStapleIds: [],
    locale: 'en-IN',
    units: 'metric',
  });
  await scan.setDetection(result.items, result.warnings);
  for (const d of result.items) if (d.confidence === 'low') await scan.confirmItem(d.id);
  expect(await scan.confirmScan()).toBe(true);
}

const rankedNow = () =>
  rankSuggestions(MOCKUP_RECIPES, {
    kitchen: selectKitchen(appStores.scan.getState(), appStores.pantry.getState()),
    prefs: selectPreferences(appStores.prefs.getState()),
    allergies: appStores.profile.getState().profile.allergies,
  });

beforeEach(async () => {
  jest.mocked(openDatabaseByName).mockImplementation(async () => createNodeDriver());
  resetMockDatabaseForTests();
  mockDb = await createMockDb();
  api = fastMockApi(mockDb);
  setApiForTests(api);
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  await metaRepo.setOnboarded(db, true);
  // appStores is a module singleton: load it from this test's fresh database, or the scan store
  // keeps the previous test's session id (and its writes fail on the foreign key).
  await hydrateStores();
  jest.mocked(Haptics.notificationAsync).mockClear();
});

afterEach(async () => {
  await cleanup();
  appQueryClient.clear();
  await flushWrites();
  setApiForTests(null);
  setDatabaseForTests(null);
  await db?.closeAsync();
  await mockDb.closeAsync();
});

// ---------- Mood ----------

describe('mood', () => {
  it('redirects to Confirm when the scan is not confirmed (deep link)', async () => {
    await renderApp('/mood');
    await waitFor(() => expect(pathname()).toBe('/scan/confirm'));
  });

  it('binds every control to the prefs store, then "Cook up ideas" → Suggestions', async () => {
    await confirmDefaultScan();
    await renderApp('/mood');
    expect(await screen.findByRole('header', { name: 'Your Mood' })).toBeOnTheScreen();
    expect(screen.getByText('Quantities confirmed')).toBeOnTheScreen();

    await fireEvent.press(await screen.findByRole('button', { name: 'Light & fresh' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Chef mode' }));
    expect(screen.getByText('Bring it on - multi-step cooking is fine.')).toBeOnTheScreen();
    await fireEvent.press(button('Increase Servings'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Starving' }));
    await fireEvent.press(button('Indian'));
    await fireEvent.press(button('Vegetarian'));
    await fireEvent.press(button('Oven'));

    const p = appStores.prefs.getState();
    expect(p).toMatchObject({
      mood: 'light',
      effort: 'chef',
      servings: 3,
      hunger: 'starving',
      cuisines: ['Indian'],
      diet: 'veg',
    });
    expect(p.equipment).toContain('oven');
    // "Any" is exclusive.
    await fireEvent.press(button('Any'));
    expect(appStores.prefs.getState().cuisines).toEqual(['Any']);
    expect(screen.getByText('Medium')).toBeOnTheScreen(); // spice 3

    await act(async () => {
      await fireEvent.press(button('Cook up ideas'));
    });
    await waitFor(() => expect(pathname()).toBe('/suggestions'));
    await flushWrites();
  });
});

// ---------- Suggestions ----------

describe('suggestions', () => {
  it('sends the confirmed kitchen + prefs, and shows the 9 ranked matches of the default seed', async () => {
    await confirmDefaultScan();
    const suggest = jest.spyOn(api, 'suggestRecipes');
    await renderApp('/suggestions');
    expect(await screen.findByText('9 matches')).toBeOnTheScreen();

    const input = suggest.mock.calls[0]![0];
    expect(input.prefs).toMatchObject({ mood: 'comfort', timeMin: 45, servings: 2 });
    expect(input.kitchen.items.map((d) => d.id)).toEqual(
      appStores.scan.getState().items.map((d) => d.id),
    );
    expect(input.kitchen.autoInclude).toBe(true);

    const expected = rankedNow().map((x) => x.recipe.name);
    expect(expected).toHaveLength(9);
    expect(screen.getByText('Comfort · 45 min · Moderate · 2 servings')).toBeOnTheScreen();
    for (const name of expected) expect(screen.getByText(name)).toBeOnTheScreen();
  });

  it('a filter chip and the sort sheet re-rank on-device without refetching', async () => {
    await confirmDefaultScan();
    const suggest = jest.spyOn(api, 'suggestRecipes');
    await renderApp('/suggestions');
    await screen.findByText('9 matches');

    await fireEvent.press(button('≤ 20 min'));
    const quick = rankedNow();
    expect(appStores.prefs.getState().filter).toBe('quick');
    expect(quick.length).toBeLessThan(9);
    expect(
      screen.getByText(`${quick.length} ${quick.length === 1 ? 'match' : 'matches'}`),
    ).toBeOnTheScreen();

    await fireEvent.press(button('Sort'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Quickest' }));
    expect(appStores.prefs.getState().sort).toBe('quick');
    expect(suggest).toHaveBeenCalledTimes(1);
  });

  it('empty → "No matches"; "Add 30 min" and "Loosen filters" bring results back', async () => {
    await confirmDefaultScan();
    // Thai is in the catalog, but no recipe is Thai: empty until the cuisine is loosened.
    await appStores.prefs.getState().update({ timeMin: 10, cuisines: ['Thai'], filter: 'protein' });
    await renderApp('/suggestions');
    expect(await screen.findByText('No matches')).toBeOnTheScreen();
    expect(screen.getByText('0 matches')).toBeOnTheScreen();

    await act(async () => {
      await fireEvent.press(button('Add 30 min'));
    });
    expect(await screen.findByText('Now 40 min')).toBeOnTheScreen();
    expect(appStores.prefs.getState().timeMin).toBe(40);
    expect(await screen.findByText('No matches')).toBeOnTheScreen();

    await act(async () => {
      await fireEvent.press(button('Loosen filters'));
    });
    expect(await screen.findByText('Filters loosened')).toBeOnTheScreen();
    expect(appStores.prefs.getState()).toMatchObject({
      filter: 'all',
      cuisines: ['Any'],
      effort: 'chef',
      timeMin: 40,
    });
    const back = rankedNow().length;
    expect(back).toBeGreaterThan(0);
    expect(await screen.findByText(`${back} matches`)).toBeOnTheScreen();
    expect(screen.queryByText('No matches')).toBeNull();
  });

  it('an error shows the retry state', async () => {
    await confirmDefaultScan();
    setApiForTests(fastMockApi(mockDb, { failureRate: 1, random: () => 0 }));
    await renderApp('/suggestions');
    expect(await screen.findByText("Couldn't load recipes")).toBeOnTheScreen();
    setApiForTests(api);
    await act(async () => {
      await fireEvent.press(button('Try again'));
    });
    expect(await screen.findByText('9 matches')).toBeOnTheScreen();
  });
});

// ---------- Recipe detail ----------

describe('recipe detail', () => {
  it('content rules: back + save only, time / kcal / protein tiles, no match %, text-only CTA', async () => {
    await confirmDefaultScan();
    const bc = recipeById('butter-chicken');
    await renderApp('/recipe/butter-chicken');
    expect(await screen.findByRole('header', { name: bc.name })).toBeOnTheScreen();
    expect(screen.getByText(`${bc.cuisine} · Moderate · Serves 2`)).toBeOnTheScreen();

    expect(screen.getByLabelText(`${bc.timeMin} min`)).toBeOnTheScreen();
    expect(screen.getByLabelText(`${bc.nutrition.kcal} kcal`)).toBeOnTheScreen();
    expect(screen.getByLabelText(`${bc.nutrition.protein}g protein`)).toBeOnTheScreen();
    expect(screen.queryByText(/\d+\s*%/)).toBeNull();
    expect(button('Back')).toBeOnTheScreen();
    expect(button('Save recipe')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /play/i })).toBeNull();
    expect(button('Start cooking')).toBeOnTheScreen();
    expect(screen.getByText('10 of 11 in your kitchen')).toBeOnTheScreen();
    expect(screen.getByText('You have 500 g')).toBeOnTheScreen();
  });

  it('the servings stepper scales quantities', async () => {
    await confirmDefaultScan();
    await renderApp('/recipe/butter-chicken');
    expect(await screen.findByText('400 g')).toBeOnTheScreen(); // chicken for 2
    await fireEvent.press(button('Increase Servings'));
    expect(screen.getByText('600 g')).toBeOnTheScreen();
    expect(appStores.prefs.getState().servings).toBe(3);
    expect(screen.getByText(/Serves 3$/)).toBeOnTheScreen();
  });

  it('tabs: steps, nutrition, swaps; save toggles the cookbook with a toast', async () => {
    await confirmDefaultScan();
    const bc = recipeById('butter-chicken');
    await renderApp('/recipe/butter-chicken');
    await screen.findByRole('header', { name: bc.name });

    await fireEvent.press(screen.getByText('Steps'));
    expect(screen.getByText(bc.steps[0]!.text)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Nutrition'));
    expect(
      screen.getByText(`${bc.nutrition.kcal} kcal · macros vs. a typical meal`),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Swaps'));
    expect(screen.getByText(`No ${bc.swaps[0]!.missing.toLowerCase()}?`)).toBeOnTheScreen();

    await act(async () => {
      await fireEvent.press(button('Save recipe'));
    });
    expect(await screen.findByText('Saved to your cookbook')).toBeOnTheScreen();
    expect(appStores.cookbook.getState().saved[0]).toBe('butter-chicken');
    expect(button('Remove from saved')).toBeOnTheScreen();
  });
});

// ---------- Cook mode ----------

describe('cook mode', () => {
  it('the step timer counts down for real, pauses, and toasts + buzzes at 0', async () => {
    await confirmDefaultScan();
    const bc = recipeById('butter-chicken');
    const first = bc.steps[0]!.minutes * 60;
    const label = (s: number) =>
      `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    await renderApp('/cook/butter-chicken');
    expect(await screen.findByText(label(first))).toBeOnTheScreen();
    expect(screen.getByText('Tap to start the timer')).toBeOnTheScreen();
    expect(screen.getByText(`Step 1 of ${bc.steps.length}`)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('cook-timer'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.getByText(label(first - 3))).toBeOnTheScreen();
    expect(screen.getByText('Tap to pause')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('cook-timer')); // pause
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(screen.getByText(label(first - 3))).toBeOnTheScreen();

    // A new step starts from its own time (the paused timer belongs to step 1).
    await fireEvent.press(button('Next step'));
    expect(screen.getByText(label(bc.steps[1]!.minutes * 60))).toBeOnTheScreen();
    expect(screen.getByText(`Step 2 of ${bc.steps.length}`)).toBeOnTheScreen();

    // The last step (the shortest timer) runs down to 0: toast + haptic.
    const last = bc.steps.length - 1;
    for (let i = 1; i < last; i++) await fireEvent.press(button('Next step'));
    const lastSecs = bc.steps[last]!.minutes * 60;
    expect(screen.getByText(label(lastSecs))).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('cook-timer'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(lastSecs * 1000 + 500);
    });
    expect(screen.getByText('00:00')).toBeOnTheScreen();
    expect(screen.getByText('Done! Tap to restart')).toBeOnTheScreen();
    expect(await screen.findByText('Timer done - on to the next step')).toBeOnTheScreen();
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('Done cooking → "Nice work" → Update pantry: 2 newly low, Home, toast, Running low rises', async () => {
    await confirmDefaultScan();
    const bc = recipeById('butter-chicken');
    await renderApp('/');
    expect(await screen.findByLabelText('Running low, 3')).toBeOnTheScreen();
    await act(async () => {
      router.push('/recipe/butter-chicken');
    });
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Start cooking' }));
    });
    await waitFor(() => expect(pathname()).toBe('/cook/butter-chicken'));

    for (let i = 1; i < bc.steps.length; i++) await fireEvent.press(button('Next step'));
    expect(screen.getByText('Last step')).toBeOnTheScreen();
    await fireEvent.press(button('Done cooking'));

    expect(await screen.findByRole('header', { name: 'Nice work' })).toBeOnTheScreen();
    expect(button('Increase Chicken breast used')).toBeOnTheScreen();
    expect(screen.getAllByText('fresh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('staple').length).toBeGreaterThan(0);

    await act(async () => {
      await fireEvent.press(button('Update pantry'));
    });
    await waitFor(() => expect(pathname()).toBe('/'));
    expect(await screen.findByText('Pantry updated · 2 items running low')).toBeOnTheScreen();
    expect(await screen.findByLabelText('Running low, 5')).toBeOnTheScreen();

    const { staples } = appStores.pantry.getState();
    const level = (id: string) => staples.find((s) => s.id === id)!.level;
    expect(level('garam_masala')).toBe(1.5);
    expect(level('red_chilli')).toBeLessThanOrEqual(1.5);
    expect(appStores.scan.getState().items.find((d) => d.id === 'chicken')!.value).toBe(100);
    expect(appStores.cookbook.getState().cooked[0]).toBe('butter-chicken');

    await flushWrites();
    const persisted = await pantryRepo.list(db);
    expect(persisted.staples.find((s) => s.id === 'garam_masala')!.level).toBe(1.5);
  });

  it('a stepper in "Nice work" changes what is deducted; nothing newly low → plain toast', async () => {
    await confirmDefaultScan();
    const bc = recipeById('butter-chicken');
    await renderApp('/cook/butter-chicken');
    await screen.findByText(`Step 1 of ${bc.steps.length}`);
    for (let i = 1; i < bc.steps.length; i++) await fireEvent.press(button('Next step'));
    await fireEvent.press(button('Done cooking'));
    expect(await screen.findByRole('header', { name: 'Nice work' })).toBeOnTheScreen();
    const sheet = screen;
    // Used nothing of the two staples that would go low.
    for (const name of ['Garam masala', 'Red chilli powder']) {
      const minus = sheet.getByRole('button', { name: `Decrease ${name} used` });
      for (let i = 0; i < 8; i++) await fireEvent.press(minus);
    }
    await act(async () => {
      await fireEvent.press(button('Update pantry'));
    });
    expect(await screen.findByText('Pantry updated')).toBeOnTheScreen();
    const low = appStores.pantry.getState().staples.filter((s) => s.level <= 1.5);
    expect(low).toHaveLength(3);
  });
});
