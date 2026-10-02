/**
 * Sprint 07 flows on the real routes: Scan → Analyzing → Confirm → Mood.
 * Same setup as app-flows.test.tsx (real SQL on the Node driver, MockApi with 0 latency), plus
 * fakes for the device APIs: expo-camera, expo-image-picker and expo-image-manipulator.
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
import { Linking } from 'react-native';

import { initDatabase } from '@/db/bootstrap';
import { openDatabaseByName, setDatabaseForTests } from '@/db/client';
import { metaRepo, scanRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { stapleOn } from '@/domain/pantry';
import { setApiForTests } from '@/services/api';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { appQueryClient } from '@/services/queries';
import { appStores, flushWrites, selectKitchen } from '@/state';
import { createMockDb, fastMockApi } from '@/testing/apiHelpers';

jest.setTimeout(60_000);

// See app-flows.test.tsx: point the router library's legacy Reanimated mock at the real module.
jest.mock('react-native-reanimated/mock', () => jest.requireActual('react-native-reanimated'));

jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));

// ---------- Device API fakes ----------

type Permission = { granted: boolean; status: string; canAskAgain: boolean };
const mockCamera = {
  permission: { granted: true, status: 'granted', canAskAgain: true } as Permission,
  request: jest.fn(async (): Promise<Permission> => mockCamera.permission),
  shots: 0,
  takePictureAsync: jest.fn(async (): Promise<{ uri: string; width: number; height: number }> => {
    mockCamera.shots += 1;
    return { uri: `file:///shot-${mockCamera.shots}.jpg`, width: 4032, height: 3024 };
  }),
};

type MockCameraProps = { onCameraReady?: () => void; testID?: string; ref?: unknown };
jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  // A ready camera: exposes takePictureAsync on its ref and reports ready once mounted.
  function CameraView({ onCameraReady, testID, ref }: MockCameraProps) {
    React.useImperativeHandle(ref as React.Ref<unknown>, () => ({
      takePictureAsync: mockCamera.takePictureAsync,
    }));
    React.useEffect(() => onCameraReady?.(), [onCameraReady]);
    return React.createElement(View, { testID });
  }
  return {
    CameraView,
    useCameraPermissions: () => [mockCamera.permission, mockCamera.request, jest.fn()],
  };
});

const mockPicker = { assets: [] as { uri: string; width: number; height: number }[] };
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () =>
    mockPicker.assets.length
      ? { canceled: false, assets: mockPicker.assets }
      : { canceled: true, assets: null },
  ),
}));

jest.mock('expo-image-manipulator', () => {
  const context = {
    resize: () => context,
    renderAsync: async () => ({
      width: 1280,
      height: 960,
      saveAsync: async () => ({ uri: 'file:///out.jpg', width: 1280, height: 960, base64: 'QUJD' }),
    }),
    release: () => undefined,
  };
  return { ImageManipulator: { manipulate: () => context }, SaveFormat: { JPEG: 'jpeg' } };
});

const { launchImageLibraryAsync } = jest.requireMock('expo-image-picker') as {
  launchImageLibraryAsync: jest.Mock;
};

// ---------- Harness ----------

let db: NodeDriver;
let mockDb: NodeDriver;
let app: ReturnType<typeof renderRouter>;

async function seedUser() {
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  await metaRepo.setOnboarded(db, true);
}

async function renderApp(initialUrl: string) {
  app = renderRouter('./src/app', { initialUrl });
  await app;
}
const pathname = () => app.getPathname();

/** The demo session the Analyzing screen would leave behind: 3 photos + their detection. */
async function seedDetection(photos = 3) {
  const scan = appStores.scan.getState();
  await scan.addPhotos(
    Array.from({ length: photos }, (_, i) => ({ uri: `file:///p${i}.jpg`, label: 'Camera' })),
  );
  // No timer-based latency: fake timers (left on by renderRouter) would never fire it here.
  const api = fastMockApi(mockDb, { sleep: async () => undefined });
  const result = await api.detectIngredients({
    images: Array.from({ length: photos }, (_, i) => ({
      id: `ph${i}`,
      mimeType: 'image/jpeg',
      base64: 'A',
    })),
    knownStapleIds: [],
    locale: 'en-IN',
    units: 'metric',
  });
  await scan.setDetection(result.items, result.warnings);
  return result;
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const card = (name: string) => within(screen.getByTestId(`qty-${name}`));

beforeEach(async () => {
  jest.mocked(openDatabaseByName).mockImplementation(async () => createNodeDriver());
  resetMockDatabaseForTests();
  mockDb = await createMockDb();
  setApiForTests(fastMockApi(mockDb));
  mockCamera.permission = { granted: true, status: 'granted', canAskAgain: true };
  mockCamera.request.mockClear();
  mockCamera.takePictureAsync.mockClear();
  mockCamera.shots = 0;
  mockPicker.assets = [];
  launchImageLibraryAsync.mockClear();
  await seedUser();
  await appStores.scan.getState().resetScan();
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

// ---------- Scan ----------

describe('scan', () => {
  it('"Analyze" is disabled at 0 photos, and the shutter adds a photo', async () => {
    await renderApp('/scan');
    expect(
      await screen.findByText('Take or upload at least one photo to continue.'),
    ).toBeOnTheScreen();
    expect(button('Analyze photos')).toBeDisabled();
    expect(screen.getByText('Open the door wide · Good light · Multiple angles')).toBeOnTheScreen();

    await act(async () => {
      await fireEvent.press(button('Take photo'));
    });
    expect(mockCamera.takePictureAsync).toHaveBeenCalledTimes(1);
    expect(button('Analyze 1 photo')).toBeEnabled();
    expect(screen.queryByText('Take or upload at least one photo to continue.')).toBeNull();
    expect(appStores.scan.getState().photos).toEqual([
      expect.objectContaining({ uri: 'file:///shot-1.jpg', label: 'Camera' }),
    ]);
  });

  it('caps the photos at 6: picker limit, cap toast, shutter disabled', async () => {
    await appStores.scan.getState().addPhotos([{ uri: 'file:///a.jpg', label: 'Camera' }]);
    // The system picker honours selectionLimit on iOS; web may not, so the store caps too.
    mockPicker.assets = Array.from({ length: 7 }, (_, i) => ({
      uri: `file:///g${i}.jpg`,
      width: 100,
      height: 100,
    }));
    await renderApp('/scan');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Add photos from gallery' }));
    });
    expect(launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: true, selectionLimit: 5 }),
    );
    expect(await screen.findByText('Added 5 photos · max 6 per scan')).toBeOnTheScreen();
    expect(appStores.scan.getState().photos).toHaveLength(6);
    expect(button('Analyze 6 photos')).toBeEnabled();
    expect(button('Take photo')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Add photos from gallery' })).toBeNull();

    // The gallery button at the cap: a toast, and no picker.
    launchImageLibraryAsync.mockClear();
    await act(async () => {
      await fireEvent.press(button('Upload from gallery'));
    });
    expect(launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(await screen.findByText('Max 6 photos per scan')).toBeOnTheScreen();
  });

  it('"Use demo photos" (mock mode) fills the strip from the mock database; × removes one', async () => {
    await renderApp('/scan');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Use demo photos' }));
    });
    expect(await screen.findByText('Added 6 photos')).toBeOnTheScreen();
    expect(appStores.scan.getState().photos.map((p) => p.label)).toEqual([
      'Fridge',
      'Pantry shelf',
      'Spice rack',
      'Vegetables',
      'Grocery haul',
      'Dairy shelf',
    ]);
    expect(screen.queryByRole('button', { name: 'Use demo photos' })).toBeNull();

    await act(async () => {
      await fireEvent.press(button('Remove photo 2'));
    });
    expect(appStores.scan.getState().photos).toHaveLength(5);
    expect(button('Analyze 5 photos')).toBeEnabled();
  });

  it('camera denied for good: "Open Settings" + the gallery alternative', async () => {
    mockCamera.permission = { granted: false, status: 'denied', canAskAgain: false };
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await renderApp('/scan');
    expect(await screen.findByText('Camera is off')).toBeOnTheScreen();
    expect(screen.queryByTestId('camera')).toBeNull();
    expect(button('Take photo')).toBeDisabled();
    expect(mockCamera.request).not.toHaveBeenCalled();

    await fireEvent.press(button('Open Settings'));
    expect(openSettings).toHaveBeenCalled();

    mockPicker.assets = [{ uri: 'file:///g.jpg', width: 10, height: 10 }];
    await act(async () => {
      await fireEvent.press(button('Choose from gallery'));
    });
    expect(appStores.scan.getState().photos).toHaveLength(1);
    expect(button('Analyze 1 photo')).toBeEnabled();
    openSettings.mockRestore();
  });

  it('asks for the camera on the first visit', async () => {
    mockCamera.permission = { granted: false, status: 'undetermined', canAskAgain: true };
    await renderApp('/scan');
    expect(await screen.findByText('Camera access')).toBeOnTheScreen();
    expect(mockCamera.request).toHaveBeenCalledTimes(1);
    await fireEvent.press(button('Allow camera'));
    expect(mockCamera.request).toHaveBeenCalledTimes(2);
  });

  it('shows the photo warning from the last detection, and Retake replaces that photo', async () => {
    await seedDetection(3);
    await renderApp('/scan');
    expect(await screen.findByText('Photo 2 looks blurry')).toBeOnTheScreen();
    await act(async () => {
      await fireEvent.press(button('Retake'));
    });
    expect(await screen.findByText('Retaken - nice and sharp')).toBeOnTheScreen();
    const { photos, warnings } = appStores.scan.getState();
    expect(photos[1]).toMatchObject({ retaken: true, uri: 'file:///shot-1.jpg' });
    expect(warnings).toEqual([]);
    expect(screen.queryByText('Photo 2 looks blurry')).toBeNull();
  });
});

// ---------- Analyzing ----------

describe('analyzing', () => {
  it('Analyze → prepares + detects → reveals the chips → lands on Confirm', async () => {
    await appStores.scan
      .getState()
      .addPhotos([1, 2, 3].map((i) => ({ uri: `file:///p${i}.jpg`, label: 'Camera' })));
    await renderApp('/scan');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Analyze 3 photos' }));
    });
    expect(pathname()).toBe('/scan/analyzing');
    expect(await screen.findByText('Reading labels, shapes and packaging…')).toBeOnTheScreen();

    // The reply arrives, then a chip every 230 ms and the advance 900 ms after the last one.
    await waitFor(() => expect(screen.getByText(/^\d+ \/ \d+$/)).toBeOnTheScreen());
    expect(button('Skip')).toBeOnTheScreen();
    // waitFor advances the fake timers step by step, letting React render between chips.
    await waitFor(() => expect(screen.getByText('Scan complete')).toBeOnTheScreen(), {
      timeout: 10_000,
    });
    expect(
      screen.getByText('Next: check the amounts - a photo can’t tell 400 g from 700 g.'),
    ).toBeOnTheScreen();
    expect(pathname()).toBe('/scan/analyzing');
    await waitFor(() => expect(pathname()).toBe('/scan/confirm'), { timeout: 5_000 });
    expect(await screen.findByRole('header', { name: 'Confirm Quantities' })).toBeOnTheScreen();

    const scan = appStores.scan.getState();
    expect(scan.status).toBe('detected');
    expect(scan.items.length).toBeGreaterThan(0);
    expect(scan.warnings).toEqual([expect.objectContaining({ photoIndex: 1, type: 'blurry' })]);
    await flushWrites();
    expect((await scanRepo.loadLatest(db))?.items).toHaveLength(scan.items.length);
  });

  it('a failed detection shows the error UI; "Try again" recovers', async () => {
    setApiForTests(fastMockApi(mockDb, { failureRate: 1, random: () => 0 }));
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await appStores.scan.getState().addPhotos([{ uri: 'file:///p.jpg', label: 'Camera' }]);
    await renderApp('/scan/analyzing');
    expect(await screen.findByText("Couldn't scan your photos")).toBeOnTheScreen();
    expect(screen.getByText('Something went wrong on our side. Try again.')).toBeOnTheScreen();
    // The top bar's back button and the EmptyState action.
    expect(screen.getAllByRole('button', { name: 'Back to camera' })).toHaveLength(2);
    expect(appStores.scan.getState()).toMatchObject({ items: [], detecting: false });

    setApiForTests(fastMockApi(mockDb));
    await act(async () => {
      await fireEvent.press(button('Try again'));
    });
    await waitFor(() => expect(screen.getByText(/^\d+ \/ \d+$/)).toBeOnTheScreen());
    await act(async () => {
      await fireEvent.press(button('Skip'));
    });
    await waitFor(() => expect(pathname()).toBe('/scan/confirm'));
    jest.mocked(console.warn).mockRestore();
  });

  it('leaving mid-scan aborts the request and writes nothing', async () => {
    setApiForTests(fastMockApi(mockDb, { latencyMs: 5_000 }));
    await appStores.scan.getState().addPhotos([{ uri: 'file:///p.jpg', label: 'Camera' }]);
    await renderApp('/scan');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Analyze 1 photo' }));
    });
    expect(await screen.findByText('Scanning')).toBeOnTheScreen();
    await act(async () => {
      await fireEvent.press(button('Back to camera'));
    });
    expect(pathname()).toBe('/scan');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6_000);
    });
    expect(appStores.scan.getState()).toMatchObject({
      items: [],
      status: 'draft',
      detecting: false,
    });
  });
});

// ---------- Confirm ----------

describe('confirm', () => {
  it('the gate: "Check N items first" until every low item is checked, then → Mood', async () => {
    const { items } = await seedDetection(3);
    const low = items.filter((d) => d.confidence === 'low');
    expect(low.length).toBeGreaterThan(1);
    await renderApp('/scan/confirm');

    const cta = await screen.findByRole('button', { name: `Check ${low.length} items first` });
    expect(cta).toBeDisabled();
    expect(screen.getByText(`${low.length} need a check`)).toBeOnTheScreen();
    expect(screen.getByText(`${items.length - low.length} look good`)).toBeOnTheScreen();
    expect(screen.getByText(`${items.length} items`)).toBeOnTheScreen();
    // The warning banner from detection.
    expect(screen.getByText('Photo 2 looks blurry')).toBeOnTheScreen();

    // Low items come first, flagged.
    const cards = screen.getAllByTestId(/^qty-/);
    expect(cards[0]!.props.testID).toBe(`qty-${low[0]!.name}`);

    for (const [i, item] of low.entries()) {
      await fireEvent.press(card(item.name).getByRole('button', { name: 'Looks right' }));
      const left = low.length - i - 1;
      if (left > 0)
        expect(button(`Check ${left} item${left === 1 ? '' : 's'} first`)).toBeDisabled();
    }
    expect(screen.queryByText(/need a check/)).toBeNull();
    const confirm = button('Confirm quantities');
    expect(confirm).toBeEnabled();
    await act(async () => {
      await fireEvent.press(confirm);
    });
    await waitFor(() => expect(pathname()).toBe('/mood'));
    const scan = appStores.scan.getState();
    expect(scan.status).toBe('confirmed');
    expect(scan.lastScan).toMatchObject({ items: items.length });
    await flushWrites();
    expect(await metaRepo.getLastScan(db)).toMatchObject({ items: items.length });
  });

  it('the unit switch shows converted values (eggs 6 pcs → 300 g)', async () => {
    await seedDetection(1);
    await renderApp('/scan/confirm');
    const eggs = () => card('Eggs');
    expect((await screen.findByTestId('qty-Eggs')).props.testID).toBe('qty-Eggs');
    expect(eggs().getByTestId('qty-value')).toHaveTextContent('6');
    await fireEvent.press(eggs().getByRole('radio', { name: 'g' }));
    expect(eggs().getByTestId('qty-value')).toHaveTextContent('300');
    // Still stored in the base unit; only the display unit changed.
    expect(appStores.scan.getState().items.find((d) => d.id === 'eggs')).toMatchObject({
      value: 6,
      displayUnit: 'g',
    });
  });

  it('"Add missed item" adds a manual item; the trash button removes one', async () => {
    await seedDetection(1);
    await renderApp('/scan/confirm');
    await fireEvent.press((await screen.findAllByRole('button', { name: 'Add missed item' }))[0]!);
    await act(async () => {
      await fireEvent.press(await screen.findByRole('button', { name: 'Fresh cream' }));
    });
    expect(await screen.findByText('Added Fresh cream')).toBeOnTheScreen();
    // A manual item counts as checked ("Confirmed", as in the mockup).
    expect(screen.getByTestId('qty-Fresh cream')).toBeOnTheScreen();
    expect(card('Fresh cream').getByText('Confirmed')).toBeOnTheScreen();
    expect(appStores.scan.getState().items.find((d) => d.id === 'cream')).toMatchObject({
      confidence: 'manual',
      touched: true,
    });

    await act(async () => {
      await fireEvent.press(button('Remove Eggs'));
    });
    expect(await screen.findByText('Removed Eggs')).toBeOnTheScreen();
    expect(screen.queryByTestId('qty-Eggs')).toBeNull();
    expect(appStores.scan.getState().items.some((d) => d.id === 'eggs')).toBe(false);
  });

  it('a pantry toggle changes what counts in the kitchen (useKitchen)', async () => {
    await seedDetection(1);
    await renderApp('/scan/confirm');
    const kitchen = () => selectKitchen(appStores.scan.getState(), appStores.pantry.getState());
    const turmeric = () => appStores.pantry.getState().staples.find((s) => s.id === 'turmeric')!;
    expect(stapleOn(turmeric(), kitchen())).toBe(true);
    expect(
      await screen.findByText("Auto-included · you don't need to scan these."),
    ).toBeOnTheScreen();

    await act(async () => {
      await fireEvent.press(screen.getByRole('switch', { name: 'Include Turmeric' }));
    });
    expect(stapleOn(turmeric(), kitchen())).toBe(false);
    expect(appStores.pantry.getState().excluded).toEqual({ turmeric: true });

    // Collapse hides the list; the count stays.
    await fireEvent.press(button('Collapse pantry'));
    expect(screen.queryByRole('switch', { name: 'Include Turmeric' })).toBeNull();
  });

  it('auto-include off: the InfoCard toggle turns it back on', async () => {
    await seedDetection(1);
    await appStores.pantry.getState().setAutoInclude(false);
    await renderApp('/scan/confirm');
    expect(await screen.findByText('Auto-include is off')).toBeOnTheScreen();
    await act(async () => {
      await fireEvent.press(screen.getByRole('switch', { name: 'Auto-include pantry staples' }));
    });
    expect(appStores.pantry.getState().autoInclude).toBe(true);
    expect(screen.getByRole('switch', { name: 'Include Turmeric' })).toBeOnTheScreen();
  });

  it('an empty detection shows "Nothing found" and keeps the CTA disabled', async () => {
    await appStores.scan.getState().addPhotos([{ uri: 'file:///p.jpg', label: 'Camera' }]);
    await appStores.scan.getState().setDetection([], []);
    await renderApp('/scan/confirm');
    expect(await screen.findByText('Nothing found')).toBeOnTheScreen();
    expect(button('Confirm quantities')).toBeDisabled();
    await fireEvent.press(button('Back to camera'));
    await waitFor(() => expect(pathname()).toBe('/scan'));
  });
});
