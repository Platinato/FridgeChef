/**
 * Sprint 06 app flows on the real routes (`src/app`): boot gate, onboarding, Home, Pantry, Saved.
 * Real SQL on the Node driver, MockApi with 0 latency via `setApiForTests`.
 */
import {
  act,
  cleanup,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
  within,
} from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { initDatabase } from '@/db/bootstrap';
import { openDatabaseByName, setDatabaseForTests } from '@/db/client';
import { metaRepo, pantryRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { setApiForTests } from '@/services/api';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { appQueryClient } from '@/services/queries';
import { appStores, flushWrites } from '@/state';
import { createMockDb, fastMockApi } from '@/testing/apiHelpers';

jest.setTimeout(30_000);

// expo-router/testing-library replaces Reanimated with require('react-native-reanimated/mock'),
// the legacy mock (no useReducedMotion in v4). Point that path at the real module, set up by
// jest.setup.ts exactly as in every other suite.
jest.mock('react-native-reanimated/mock', () => jest.requireActual('react-native-reanimated'));

// The mock backend database (reset by "Reset demo data") opens on the Node driver here.
// openAppDatabase uses the real opener internally, so a missing user DB still fails (boot test).
jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));

const spies: jest.SpyInstance[] = [];
const spy = <T extends jest.SpyInstance>(instance: T): T => {
  spies.push(instance);
  return instance;
};

let db: NodeDriver;
let mockDb: NodeDriver;

/** A seeded user database (mock-mode demo user), optionally past onboarding. */
async function seedUser({ onboarded }: { onboarded: boolean }) {
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  if (onboarded) await metaRepo.setOnboarded(db, true);
}

// renderRouter returns RNTL 14's render promise with getPathname() attached to the promise itself.
let app: ReturnType<typeof renderRouter>;
async function renderApp(initialUrl = '/') {
  app = renderRouter('./src/app', { initialUrl });
  await app;
}
const pathname = () => app.getPathname();

beforeEach(async () => {
  jest.mocked(openDatabaseByName).mockImplementation(async () => createNodeDriver());
  resetMockDatabaseForTests();
  mockDb = await createMockDb();
  setApiForTests(fastMockApi(mockDb));
});

afterEach(async () => {
  await cleanup();
  appQueryClient.clear();
  await flushWrites();
  setApiForTests(null);
  setDatabaseForTests(null);
  await db?.closeAsync();
  await mockDb.closeAsync();
  // Only our own spies: restoreAllMocks() would also undo Reanimated's setUpTests() mocks.
  spies.splice(0).forEach((spy) => spy.mockRestore());
});

describe('boot gate', () => {
  it('shows the error screen when the database fails to open, and Retry recovers', async () => {
    db = createNodeDriver();
    setDatabaseForTests(null); // no driver: the device opener fails under Jest
    spy(jest.spyOn(console, 'error').mockImplementation(() => undefined));
    await renderApp();
    expect(await screen.findByText("Couldn't open your kitchen")).toBeOnTheScreen();

    setDatabaseForTests(db);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    // Boot succeeds: first launch → the demo seed → not onboarded → onboarding.
    expect(await screen.findByRole('header', { name: 'Step 01 Snap' })).toBeOnTheScreen();
    expect(pathname()).toBe('/onboarding');
  });
});

describe('onboarding', () => {
  it('slides → taste setup → "Let\'s cook" sets onboarded, syncs prefs and goes Home', async () => {
    await seedUser({ onboarded: false });
    await renderApp();
    expect(await screen.findByRole('header', { name: 'Step 01 Snap' })).toBeOnTheScreen();
    expect(pathname()).toBe('/onboarding');

    await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('header', { name: 'Step 02 Confirm' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Skip' }));

    // Taste setup, from the catalog.
    await fireEvent.press(await screen.findByRole('button', { name: 'Vegetarian' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Dairy' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Increase Household size' }));
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: "Let's cook" }));
    });

    await waitFor(() => expect(pathname()).toBe('/'));
    expect(await screen.findByText('Welcome to FridgeChef')).toBeOnTheScreen();
    const { onboarded, profile } = appStores.profile.getState();
    expect(onboarded).toBe(true);
    expect(profile).toMatchObject({ diet: 'veg', allergies: ['Dairy'], householdSize: 3 });
    expect(appStores.prefs.getState()).toMatchObject({ diet: 'veg', servings: 3 });
    await flushWrites();
    expect(await metaRepo.getOnboarded(db)).toBe(true);
  });
});

describe('home', () => {
  it('shows the running-low count, the last scan, and Scan now opens /scan', async () => {
    await seedUser({ onboarded: true });
    await renderApp();
    expect(await screen.findByRole('header', { name: 'Explore Recipes' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Running low, 3')).toBeOnTheScreen();
    expect(screen.getByText('2 days ago · 11 items')).toBeOnTheScreen();
    // Cook again: compact cards with a match % (the demo's cooked recipes).
    expect(screen.getByText('Egg Fried Rice')).toBeOnTheScreen();
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0);
    // Mood chips come from the catalog.
    await fireEvent.press(await screen.findByRole('button', { name: 'Lazy' }));
    expect(appStores.prefs.getState().mood).toBe('lazy');

    await fireEvent.press(screen.getByRole('button', { name: 'Scan now' }));
    await waitFor(() => expect(pathname()).toBe('/scan'));
    // The Sprint 07 Scan screen (its flows are in scan-flow.test.tsx).
    expect(await screen.findByTestId('scan-screen')).toBeOnTheScreen();
  });

  it("a running-low card opens Pantry with that staple's sheet", async () => {
    await seedUser({ onboarded: true });
    await renderApp();
    await fireEvent.press(await screen.findByRole('button', { name: /^Salt, running low/ }));
    await waitFor(() => expect(pathname()).toBe('/pantry'));
    expect(await screen.findByText('Pack size')).toBeOnTheScreen();
    expect(screen.getByText('1 kg pack')).toBeOnTheScreen();
  });
});

describe('bottom nav', () => {
  it('switches tabs, and Scan pushes the full-screen /scan route (no nav there)', async () => {
    await seedUser({ onboarded: true });
    await renderApp();
    await screen.findByRole('header', { name: 'Explore Recipes' });
    await fireEvent.press(screen.getByRole('tab', { name: 'Pantry' }));
    await waitFor(() => expect(pathname()).toBe('/pantry'));
    await fireEvent.press(screen.getByRole('tab', { name: 'Saved' }));
    await waitFor(() => expect(pathname()).toBe('/saved'));
    await fireEvent.press(screen.getByRole('tab', { name: 'Scan' }));
    await waitFor(() => expect(pathname()).toBe('/scan'));
    expect(screen.queryByRole('tab', { name: 'Home' })).toBeNull();
  });
});

describe('pantry', () => {
  it('level edit and refill update the store and SQLite', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/pantry');
    expect(await screen.findByLabelText('25 staples')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /^Turmeric, running low/ }));
    expect(await screen.findByText('Pack size')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Level 4 of 5' }));
    expect(appStores.pantry.getState().staples.find((s) => s.id === 'turmeric')?.level).toBe(4);

    await fireEvent.press(screen.getByRole('button', { name: 'Mark refilled' }));
    expect(await screen.findByText('Marked as refilled')).toBeOnTheScreen();
    expect(screen.queryByText('Pack size')).toBeNull(); // the sheet closed
    await flushWrites();
    const turmeric = (await pantryRepo.list(db)).staples.find((s) => s.id === 'turmeric');
    expect(turmeric?.level).toBe(5);
    expect(screen.getByLabelText('Running low, 2')).toBeOnTheScreen();
  });

  it('adds a staple from the catalog suggestions, filtered by search', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/pantry');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add staple' }));
    await fireEvent.changeText(await screen.findByPlaceholderText('Search staples'), 'card');
    expect(screen.queryByRole('button', { name: 'Cinnamon' })).toBeNull();
    await fireEvent.press(await screen.findByRole('button', { name: 'Cardamom' }));
    expect(await screen.findByText('Cardamom added to your pantry')).toBeOnTheScreen();
    expect(appStores.pantry.getState().staples.at(-1)).toMatchObject({ id: 'cardamom', level: 5 });
  });

  it('the auto-include toggle writes through', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/pantry');
    await fireEvent.press(await screen.findByRole('switch', { name: /Auto-include in scans/ }));
    expect(appStores.pantry.getState().autoInclude).toBe(false);
    await flushWrites();
    expect(await metaRepo.getAutoInclude(db)).toBe(false);
  });
});

describe('saved / profile', () => {
  it('saved cards show effort (not %), and Default effort has no level bars', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/saved');
    expect(await screen.findByText('Palak Paneer')).toBeOnTheScreen();
    expect(screen.getByText('Shakshuka')).toBeOnTheScreen();
    expect(screen.queryAllByText(/%/)).toEqual([]);
    expect(screen.getAllByText('Effort').length).toBe(2);

    // The group View carries role radiogroup but isn't an accessibility element: query by label.
    const effort = screen.getByLabelText('Default effort');
    expect(within(effort).getAllByRole('radio')).toHaveLength(3);
    expect(within(effort).queryAllByLabelText(/Level/)).toEqual([]); // plain: no level bars
    await fireEvent.press(screen.getByRole('radio', { name: 'Chef mode' }));
    expect(appStores.profile.getState().profile.defaultEffort).toBe('chef');
    expect(appStores.prefs.getState().effort).toBe('chef');
  });

  it('the diet sheet sets the diet', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/saved');
    await fireEvent.press(await screen.findByRole('button', { name: /^Diet/ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Vegan' }));
    expect(appStores.profile.getState().profile.diet).toBe('vegan');
  });

  it('"Reset demo data" (confirmed) restores the seed and returns to onboarding', async () => {
    await seedUser({ onboarded: true });
    spy(
      jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
        buttons?.find((b) => b.style === 'destructive')?.onPress?.();
      }),
    );
    await renderApp('/saved');
    await act(async () => {
      await appStores.pantry.getState().remove('salt');
      await appStores.cookbook
        .getState()
        .toggleSave(appStores.cookbook.getState().snapshots['shakshuka']!);
    });

    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Reset demo data' }));
    });
    await waitFor(() => expect(pathname()).toBe('/onboarding'));
    expect(appStores.pantry.getState().staples).toHaveLength(25);
    expect(appStores.cookbook.getState().saved).toEqual(['palak-paneer', 'shakshuka']);
    await flushWrites();
    expect((await pantryRepo.list(db)).staples.map((s) => s.id)).toContain('salt');
  });

  it('"Replay onboarding" goes back to onboarding', async () => {
    await seedUser({ onboarded: true });
    await renderApp('/saved');
    await fireEvent.press(await screen.findByRole('button', { name: 'Replay onboarding' }));
    await waitFor(() => expect(pathname()).toBe('/onboarding'));
  });
});
