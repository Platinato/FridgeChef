/**
 * Sprint 09: the whole loop on the real routes, in mock mode, the way a tester would do it.
 * Onboarding is skipped via a seeded Node-driver database; then Home → Scan ("Use demo photos")
 * → Analyzing → Confirm → Mood → Suggestions → Recipe → Cook → "Update pantry" → Home, and
 * finally "Reset demo data" after the long session. The second run injects a 30% mock failure
 * rate (seeded, so it's repeatable) and must complete by pressing "Try again" wherever an
 * error appears, with no crash.
 */
import { act, cleanup, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { initDatabase } from '@/db/bootstrap';
import { openDatabaseByName, setDatabaseForTests } from '@/db/client';
import { metaRepo, pantryRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { lowStaples } from '@/domain/pantry';
import { setApiForTests } from '@/services/api';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { appQueryClient } from '@/services/queries';
import { appStores, flushWrites, hydrateStores } from '@/state';
import { createMockDb, fastMockApi } from '@/testing/apiHelpers';

jest.setTimeout(120_000);

jest.mock('react-native-reanimated/mock', () => jest.requireActual('react-native-reanimated'));
jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-camera', () => ({
  // No camera in this run: the tester uses "Use demo photos".
  CameraView: () => null,
  useCameraPermissions: () => [
    { granted: false, status: 'denied', canAskAgain: false },
    jest.fn(),
    jest.fn(),
  ],
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
jest.mock('expo-image-manipulator', () => {
  const context = {
    resize: () => context,
    renderAsync: async () => ({
      width: 800,
      height: 600,
      saveAsync: async () => ({ uri: 'file:///out.jpg', width: 800, height: 600, base64: 'QUJD' }),
    }),
    release: () => undefined,
  };
  return { ImageManipulator: { manipulate: () => context }, SaveFormat: { JPEG: 'jpeg' } };
});

let db: NodeDriver;
let mockDb: NodeDriver;
let app: ReturnType<typeof renderRouter>;
let retries = 0;
const pathname = () => app.getPathname();

/** A small LCG, so "30% of calls fail" is the same sequence on every run. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

const tick = (ms = 250) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const press = (el: Parameters<typeof fireEvent.press>[0]) =>
  act(async () => {
    await fireEvent.press(el);
  });

/**
 * Waits until `done()` holds, pressing "Try again" on any error state on the way (the tester's
 * only recovery). Throws with `label` if it never gets there.
 */
async function reach(label: string, done: () => boolean, steps = 120) {
  for (let i = 0; i < steps; i++) {
    if (done()) return;
    const retry = screen.queryAllByRole('button', { name: 'Try again' })[0];
    if (retry) {
      retries += 1;
      await press(retry);
    }
    await tick();
  }
  throw new Error(`Never reached: ${label} (at ${pathname()})`);
}

const has = (name: string | RegExp) => screen.queryAllByRole('button', { name }).length > 0;
const button = (name: string | RegExp) => screen.getAllByRole('button', { name })[0]!;

async function fullLoop() {
  app = renderRouter('./src/app', { initialUrl: '/' });
  await app;
  await reach('Home', () => has('Scan now'));
  const lowBefore = lowStaples(appStores.pantry.getState().staples).length;

  // Scan: no camera here, so the demo photos.
  await press(button('Scan now'));
  await reach('Scan with demo photos', () => has('Use demo photos'));
  await press(button('Use demo photos'));
  await reach('6 photos', () => has('Analyze 6 photos'));
  await press(button('Analyze 6 photos'));

  // Analyzing → (Try again on a failure) → Confirm.
  await reach(
    'Confirm',
    () => pathname() === '/scan/confirm' && has(/first$|^Confirm quantities$/),
  );
  while (has('Looks right')) await press(button('Looks right'));
  await press(button('Confirm quantities'));
  await reach('Mood', () => pathname() === '/mood' && has('Cook up ideas'));

  await press(button('Cook up ideas'));
  await reach('Suggestions', () => has(/^Butter Chicken Lite, /));
  await press(button(/^Butter Chicken Lite, /));
  await reach('Recipe', () => has('Start cooking'));

  await press(button('Start cooking'));
  await reach('Cook mode', () => has('Next step'));
  while (has('Next step')) await press(button('Next step'));
  await press(button('Done cooking'));
  await reach('Nice work', () => has('Update pantry'));
  await press(button('Update pantry'));
  await reach('Home again', () => pathname() === '/' && has('Scan now'));

  expect(await screen.findByText(/^Pantry updated/)).toBeOnTheScreen();
  const lowAfter = lowStaples(appStores.pantry.getState().staples).length;
  expect(lowAfter).toBeGreaterThan(lowBefore);
  expect(screen.getByLabelText(`Running low, ${lowAfter}`)).toBeOnTheScreen();
  expect(appStores.cookbook.getState().cooked[0]).toBe('butter-chicken');
  await flushWrites();
  const persisted = await pantryRepo.list(db);
  expect(lowStaples(persisted.staples)).toHaveLength(lowAfter);
}

beforeEach(async () => {
  retries = 0;
  jest.mocked(openDatabaseByName).mockImplementation(async () => createNodeDriver());
  resetMockDatabaseForTests();
  mockDb = await createMockDb();
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  await metaRepo.setOnboarded(db, true);
  await hydrateStores();
});

afterEach(async () => {
  await cleanup();
  appQueryClient.clear();
  await flushWrites();
  setApiForTests(null);
  setDatabaseForTests(null);
  await db.closeAsync();
  await mockDb.closeAsync();
});

describe('full loop (mock mode)', () => {
  it('scan with demo photos → confirm → mood → suggestions → recipe → cook → pantry → reset', async () => {
    setApiForTests(fastMockApi(mockDb));
    await fullLoop();
    expect(retries).toBe(0);

    // "Reset demo data" still works after the long session.
    const confirm = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await press(button('Saved'));
    await reach('Saved', () => has('Reset demo data'));
    await press(button('Reset demo data'));
    await reach('Onboarding', () => pathname() === '/onboarding');
    expect(appStores.scan.getState().items).toEqual([]);
    expect(appStores.cookbook.getState().cooked[0]).not.toBe('butter-chicken');
    confirm.mockRestore();
  });

  it('at a 30% mock failure rate: completes with retries and no crash', async () => {
    const quiet = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Seed 285 draws 0.35, 0.13, 0.96, 0.22, 0.33, …: the catalog loads, detection fails and its
    // retry succeeds, suggestions fail and their retry succeeds. Both calls that block the loop
    // must be recovered with "Try again" (later draws hit only background refreshes).
    const next = seeded(285);
    let injected = 0;
    const random = () => {
      const r = next();
      if (r < 0.3) injected += 1;
      return r;
    };
    setApiForTests(fastMockApi(mockDb, { failureRate: 0.3, random }));
    await fullLoop();
    expect(injected).toBeGreaterThanOrEqual(2);
    expect(retries).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Something went wrong')).toBeNull();
    quiet.mockRestore();
  });
});
