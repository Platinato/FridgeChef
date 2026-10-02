/**
 * Sprint 09 resilience on the real routes: the app-level error boundary, the offline banner (and
 * the query layer's online state), an outdated app meeting a newer database, and a failed write.
 */
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from 'expo-router/testing-library';

import { initDatabase } from '@/db/bootstrap';
import { openDatabaseByName, setDatabaseForTests } from '@/db/client';
import { metaRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { setApiForTests } from '@/services/api';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { config } from '@/services/config';
import { connectOnlineManager, isOfflineState } from '@/services/network';
import { appQueryClient } from '@/services/queries';
import { appStores, flushWrites } from '@/state';
import { createMockDb, fastMockApi } from '@/testing/apiHelpers';

jest.setTimeout(60_000);

jest.mock('react-native-reanimated/mock', () => jest.requireActual('react-native-reanimated'));
jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));

// Home throws while `on`, to exercise the root layout's ErrorBoundary. (React retries a failed
// render once before the boundary takes over, so throwing a single time would hide the error.)
const mockCrash = { on: false };
jest.mock('@/screens/HomeScreen', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const actual = jest.requireActual<typeof import('@/screens/HomeScreen')>('@/screens/HomeScreen');
  function HomeScreen() {
    if (mockCrash.on) throw new Error('Home blew up');
    return React.createElement(actual.HomeScreen);
  }
  return { HomeScreen };
});

let db: NodeDriver | undefined;
let mockDb: NodeDriver;
let app: ReturnType<typeof renderRouter>;
const online = jest.mocked(useNetInfo).getMockImplementation()?.() ?? jest.mocked(useNetInfo)();

async function renderApp(initialUrl = '/') {
  app = renderRouter('./src/app', { initialUrl });
  await app;
}

async function seedUser(): Promise<NodeDriver> {
  const d = createNodeDriver();
  db = d;
  setDatabaseForTests(d);
  await initDatabase({ mode: 'mock' });
  await metaRepo.setOnboarded(d, true);
  return d;
}

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
  db = undefined; // a test without its own database must not close the last one twice
  await mockDb.closeAsync();
  jest.mocked(useNetInfo).mockReturnValue(online);
});

describe('error boundary', () => {
  it('a render error shows the friendly fallback, and "Restart" recovers', async () => {
    await seedUser();
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockCrash.on = true;
    await renderApp('/');
    expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'FridgeChef hit a snag. Your pantry and saved recipes are safe on this phone.',
      ),
    ).toBeOnTheScreen();

    mockCrash.on = false; // whatever went wrong has passed
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Restart' }));
    });
    expect(await screen.findByRole('header', { name: 'Explore Recipes' })).toBeOnTheScreen();
    quiet.mockRestore();
  });
});

describe('offline', () => {
  it('shows the offline banner while the phone has no connection', async () => {
    await seedUser();
    jest.mocked(useNetInfo).mockReturnValue({
      ...online,
      isConnected: false,
      isInternetReachable: false,
    } as typeof online);
    await renderApp('/');
    expect(await screen.findByTestId('offline-banner')).toBeOnTheScreen();
    expect(
      screen.getByText("You're offline · your pantry and saved recipes still work"),
    ).toBeOnTheScreen();
    // Mock mode keeps working offline: the catalog still loads (mood chips).
    expect(await screen.findByRole('button', { name: 'Light & fresh' })).toBeOnTheScreen();
  });

  it('no banner when online, or when the state is still unknown', async () => {
    expect(isOfflineState({ isConnected: null })).toBe(false);
    expect(isOfflineState({ isConnected: true })).toBe(false);
    await seedUser();
    await renderApp('/');
    await screen.findByRole('header', { name: 'Explore Recipes' });
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('only http mode ties the query layer to the connection', () => {
    const add = jest.mocked(NetInfo.addEventListener);
    add.mockClear();
    expect(connectOnlineManager({ ...config, API_MODE: 'mock' })).toBe(false);
    expect(add).not.toHaveBeenCalled();

    expect(
      connectOnlineManager({ ...config, API_MODE: 'http', API_BASE_URL: 'https://api.test' }),
    ).toBe(true);
    const listener = add.mock.calls[0]![0] as (s: { isConnected: boolean | null }) => void;
    listener({ isConnected: false });
    expect(onlineManager.isOnline()).toBe(false);
    listener({ isConnected: true });
    expect(onlineManager.isOnline()).toBe(true);
    // Back to the default listener for the rest of the run.
    onlineManager.setEventListener(() => () => undefined);
    onlineManager.setOnline(true);
  });
});

describe('database', () => {
  it('a database from a newer app shows "Update FridgeChef" and is left untouched', async () => {
    const newer = createNodeDriver();
    db = newer;
    await newer.execAsync('PRAGMA user_version = 99');
    setDatabaseForTests(newer);
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderApp('/');
    expect(await screen.findByText('Update FridgeChef')).toBeOnTheScreen();
    const row = await newer.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(99);
    quiet.mockRestore();
  });

  it('a failed write toasts and keeps the UI on the new value', async () => {
    const d = await seedUser();
    await renderApp('/pantry');
    const toggle = await screen.findByRole('switch', { name: 'Auto-include in scans' });
    expect(toggle.props.accessibilityState).toMatchObject({ checked: true });

    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const fail = jest
      .spyOn(metaRepo, 'setAutoInclude')
      .mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      await fireEvent.press(toggle);
    });
    expect(await screen.findByText("Couldn't save that change")).toBeOnTheScreen();
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: 'Auto-include in scans' }).props.accessibilityState,
      ).toMatchObject({ checked: false }),
    );
    expect(appStores.pantry.getState().autoInclude).toBe(false);
    fail.mockRestore();
    quiet.mockRestore();

    // The next write goes through again.
    await act(async () => {
      await fireEvent.press(screen.getByRole('switch', { name: 'Auto-include in scans' }));
    });
    await flushWrites();
    expect(await metaRepo.getAutoInclude(d)).toBe(true);
  });
});
