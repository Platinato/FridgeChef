import { createStore } from 'zustand/vanilla';

import { getDb } from '@/db/client';
import type { SqlDriver } from '@/db/driver';
import { metaRepo, scanRepo } from '@/db/repositories';
import { capPhotos, manualItem, pendingChecks, removePhotoAt, retakePhoto } from '@/domain/scan';
import type {
  AddableItem,
  DetectedItem,
  LastScan,
  Photo,
  PhotoWarning,
  ScanStatus,
} from '@/domain/types';
import { toBase, unitsOf } from '@/domain/units';

import { newId, nowIso, writeThrough } from './persist';

/** A photo from the camera or picker; the store assigns the id. */
export type NewPhoto = { uri: string; label?: string };

export type ScanState = {
  hydrated: boolean;
  /** `null` until the first photo or detection creates a session. */
  sessionId: string | null;
  status: ScanStatus;
  confirmedAt: string | null;
  photos: Photo[];
  items: DetectedItem[];
  warnings: PhotoWarning[];
  /** Home's "Last scan" line; set by `confirmScan`. */
  lastScan: LastScan | null;
  /** Transient: a detection request is in flight. Never written to the database. */
  detecting: boolean;

  hydrate(): Promise<void>;
  /** Adds photos up to the 6-photo cap. `dropped` = how many didn't fit ("max 6 per scan"). */
  addPhotos(photos: NewPhoto[]): Promise<{ added: number; dropped: number }>;
  removePhoto(id: string): Promise<boolean>;
  /** A retaken photo: marked (and replaced by `uri`, the new shot, if given); its warnings cleared. */
  markRetaken(id: string, uri?: string): Promise<boolean>;
  setDetecting(detecting: boolean): void;
  /** A fresh detection replaces the items + warnings and clears any earlier confirmation. */
  setDetection(items: DetectedItem[], warnings: PhotoWarning[]): Promise<boolean>;
  /** Slider / stepper: value in the display unit → stored in the base unit, marked touched. */
  setQty(id: string, displayValue: number): Promise<boolean>;
  /** Switches the display unit (base or alt). Doesn't count as a check. */
  setUnit(id: string, unit: string): Promise<boolean>;
  /** "Looks right". */
  confirmItem(id: string): Promise<boolean>;
  removeItem(id: string): Promise<boolean>;
  /** "Add missed item". Resolves false when the item is already in the list. */
  addManualItem(item: AddableItem): Promise<boolean>;
  /** The gate: resolves false while any low-confidence item is unchecked. */
  confirmScan(): Promise<boolean>;
  /** Discards the current session (photos, items, warnings). `lastScan` stays. */
  resetScan(): Promise<boolean>;
};

const EMPTY = {
  sessionId: null,
  status: 'draft' as ScanStatus,
  confirmedAt: null,
  photos: [] as Photo[],
  items: [] as DetectedItem[],
  warnings: [] as PhotoWarning[],
  detecting: false,
};

export const createScanStore = () =>
  createStore<ScanState>()((set, get) => {
    /** The current session id, creating one (in state and, via the write, in SQLite) if needed. */
    const session = () => {
      const existing = get().sessionId;
      if (existing) return { id: existing, createdAt: null };
      const id = newId('scn');
      set({ sessionId: id, status: 'draft' });
      return { id, createdAt: nowIso() };
    };
    const ensure = (db: SqlDriver, s: { id: string; createdAt: string | null }) =>
      s.createdAt ? scanRepo.ensureSession(db, s.id, s.createdAt) : Promise.resolve();

    const savePhotos = (label: string, photos: Photo[], warnings: PhotoWarning[]) => {
      const s = session();
      set({ photos, warnings });
      return writeThrough(label, async (db) => {
        await ensure(db, s);
        await scanRepo.savePhotos(db, s.id, photos, warnings);
      });
    };

    const patchItem = (
      label: string,
      id: string,
      patch: (d: DetectedItem) => DetectedItem | null,
    ) => {
      const { sessionId, items } = get();
      const item = items.find((d) => d.id === id);
      const next = item && patch(item);
      if (!sessionId || !next) return Promise.resolve(false);
      set({ items: items.map((d) => (d.id === id ? next : d)) });
      return writeThrough(label, (db) => scanRepo.updateItems(db, sessionId, [next]));
    };

    return {
      ...EMPTY,
      hydrated: false,
      lastScan: null,

      async hydrate() {
        const db = getDb();
        const [current, lastScan] = await Promise.all([
          scanRepo.loadLatest(db),
          metaRepo.getLastScan(db),
        ]);
        set({
          ...EMPTY,
          hydrated: true,
          lastScan,
          ...(current && {
            sessionId: current.id,
            status: current.status,
            confirmedAt: current.confirmedAt,
            photos: current.photos,
            items: current.items,
            warnings: current.warnings,
          }),
        });
      },

      async addPhotos(incoming) {
        const fresh = incoming.map((p, i) => ({ ...p, id: newId(`ph${i}`), retaken: false }));
        const { photos, dropped } = capPhotos(get().photos, fresh);
        const added = incoming.length - dropped;
        if (added > 0) await savePhotos('scan.addPhotos', photos, get().warnings);
        return { added, dropped };
      },

      removePhoto(id) {
        const next = removePhotoAt(get().photos, get().warnings, id);
        return savePhotos('scan.removePhoto', next.photos, next.warnings);
      },

      markRetaken(id, uri) {
        const next = retakePhoto(get().photos, get().warnings, id, uri);
        return savePhotos('scan.retake', next.photos, next.warnings);
      },

      setDetecting: (detecting) => set({ detecting }),

      setDetection(items, warnings) {
        const s = session();
        set({ items, warnings, status: 'detected', confirmedAt: null });
        return writeThrough('scan.setDetection', async (db) => {
          await ensure(db, s);
          await scanRepo.saveDetection(db, s.id, items, warnings);
        });
      },

      setQty: (id, displayValue) =>
        patchItem('scan.setQty', id, (d) => ({
          ...d,
          value: toBase(d, displayValue),
          touched: true,
        })),

      setUnit: (id, unit) =>
        patchItem('scan.setUnit', id, (d) =>
          unitsOf(d).includes(unit) ? { ...d, displayUnit: unit } : null,
        ),

      confirmItem: (id) => patchItem('scan.confirmItem', id, (d) => ({ ...d, touched: true })),

      removeItem(id) {
        const { sessionId, items } = get();
        if (!sessionId || !items.some((d) => d.id === id)) return Promise.resolve(false);
        set({ items: items.filter((d) => d.id !== id) });
        return writeThrough('scan.removeItem', (db) => scanRepo.removeItem(db, sessionId, id));
      },

      addManualItem(addable) {
        if (get().items.some((d) => d.id === addable.id)) return Promise.resolve(false);
        const s = session();
        const item = manualItem(addable);
        set({ items: [...get().items, item] });
        return writeThrough('scan.addManualItem', async (db) => {
          await ensure(db, s);
          await scanRepo.addItem(db, s.id, item);
        });
      },

      async confirmScan() {
        const { sessionId, items } = get();
        if (!sessionId || pendingChecks(items).length > 0) return false;
        const at = nowIso();
        const lastScan = { at, items: items.length };
        set({ status: 'confirmed', confirmedAt: at, lastScan });
        return writeThrough('scan.confirm', (db) =>
          db.withTransactionAsync(async () => {
            await scanRepo.setStatus(db, sessionId, 'confirmed', at);
            await metaRepo.setLastScan(db, lastScan);
          }),
        );
      },

      resetScan() {
        const { sessionId } = get();
        set({ ...EMPTY });
        if (!sessionId) return Promise.resolve(true);
        return writeThrough('scan.reset', (db) => scanRepo.deleteSession(db, sessionId));
      },
    };
  });
