/** The scan session: `scan_sessions` + its photos, items and warnings (cascade-deleted with it). */
import { z } from 'zod';

import type { DetectedItem, Photo, PhotoWarning, ScanSession, ScanStatus } from '@/domain/types';

import type { SqlDriver } from '../driver';
import {
  altUnit,
  boolColumn,
  itemConfidence,
  jsonColumn,
  parseRow,
  photoWarningType,
  scanStatus,
  toSqlBool,
} from './rows';

const sessionRow = z.object({
  id: z.string(),
  created_at: z.string(),
  confirmed_at: z.string().nullable(),
  status: scanStatus,
});

const photoRow = z
  .object({ id: z.string(), uri: z.string(), label: z.string().nullable(), retaken: boolColumn })
  .transform((r): Photo => ({
    id: r.id,
    uri: r.uri,
    retaken: r.retaken,
    ...(r.label !== null && { label: r.label }),
  }));

const itemRow = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    unit: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    estimate: z.number().nullable(),
    value: z.number(),
    display_unit: z.string(),
    alt_unit: jsonColumn(altUnit).nullable(),
    confidence: itemConfidence,
    photo_index: z.number().int().nullable(),
    image_url: z.string().nullable(),
    touched: boolColumn,
  })
  .transform((r): DetectedItem => ({
    id: r.id,
    name: r.name,
    category: r.category,
    unit: r.unit,
    min: r.min,
    max: r.max,
    step: r.step,
    estimate: r.estimate,
    value: r.value,
    displayUnit: r.display_unit,
    ...(r.alt_unit && { altUnit: r.alt_unit }),
    confidence: r.confidence,
    photoIndex: r.photo_index,
    ...(r.image_url !== null && { imageUrl: r.image_url }),
    touched: r.touched,
  }));

const warningRow = z
  .object({ photo_index: z.number().int(), type: photoWarningType, message: z.string() })
  .transform((r): PhotoWarning => ({
    photoIndex: r.photo_index,
    type: r.type,
    message: r.message,
  }));

const ITEM_COLUMNS = `id, name, category, unit, min, max, step, estimate, value, display_unit, alt_unit,
  confidence, photo_index, image_url, touched`;

const itemParams = (sessionId: string, d: DetectedItem, sortOrder: number) =>
  [
    sessionId,
    d.id,
    d.name,
    d.category,
    d.unit,
    d.min,
    d.max,
    d.step,
    d.estimate,
    d.value,
    d.displayUnit,
    d.altUnit ? JSON.stringify(d.altUnit) : null,
    d.confidence,
    d.photoIndex,
    d.imageUrl ?? null,
    toSqlBool(d.touched),
    sortOrder,
  ] as const;

const INSERT_ITEM = `INSERT INTO scan_items (session_id, ${ITEM_COLUMNS}, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

async function replaceItems(
  db: SqlDriver,
  sessionId: string,
  items: DetectedItem[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM scan_items WHERE session_id = ?', [sessionId]);
    for (const [i, d] of items.entries())
      await db.runAsync(INSERT_ITEM, itemParams(sessionId, d, i));
  });
}

async function replaceWarnings(
  db: SqlDriver,
  sessionId: string,
  warnings: PhotoWarning[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM scan_warnings WHERE session_id = ?', [sessionId]);
    for (const w of warnings) {
      await db.runAsync(
        'INSERT INTO scan_warnings (session_id, photo_index, type, message) VALUES (?, ?, ?, ?)',
        [sessionId, w.photoIndex, w.type, w.message],
      );
    }
  });
}

async function setStatus(
  db: SqlDriver,
  sessionId: string,
  status: ScanStatus,
  confirmedAt: string | null,
): Promise<void> {
  await db.runAsync('UPDATE scan_sessions SET status = ?, confirmed_at = ? WHERE id = ?', [
    status,
    confirmedAt,
    sessionId,
  ]);
}

export const scanRepo = {
  /** The newest session with its photos, items and warnings, or `null` when there is none. */
  async loadLatest(db: SqlDriver): Promise<ScanSession | null> {
    const raw = await db.getFirstAsync<unknown>(
      'SELECT id, created_at, confirmed_at, status FROM scan_sessions ORDER BY created_at DESC, rowid DESC LIMIT 1',
    );
    if (!raw) return null;
    const s = parseRow(sessionRow, raw, 'scan_sessions');
    const [photos, items, warnings] = await Promise.all([
      db.getAllAsync<unknown>(
        'SELECT id, uri, label, retaken FROM scan_photos WHERE session_id = ? ORDER BY idx',
        [s.id],
      ),
      db.getAllAsync<unknown>(
        `SELECT ${ITEM_COLUMNS} FROM scan_items WHERE session_id = ? ORDER BY sort_order`,
        [s.id],
      ),
      db.getAllAsync<unknown>(
        'SELECT photo_index, type, message FROM scan_warnings WHERE session_id = ? ORDER BY photo_index, id',
        [s.id],
      ),
    ]);
    return {
      id: s.id,
      createdAt: s.created_at,
      confirmedAt: s.confirmed_at,
      status: s.status,
      photos: photos.map((r) => parseRow(photoRow, r, 'scan_photos')),
      items: items.map((r) => parseRow(itemRow, r, 'scan_items')),
      warnings: warnings.map((r) => parseRow(warningRow, r, 'scan_warnings')),
    };
  },

  /** Creates the session row if it doesn't exist yet. */
  async ensureSession(db: SqlDriver, id: string, createdAt: string): Promise<void> {
    await db.runAsync(
      `INSERT INTO scan_sessions (id, created_at, confirmed_at, status) VALUES (?, ?, NULL, 'draft')
       ON CONFLICT (id) DO NOTHING`,
      [id, createdAt],
    );
  },

  /** Replaces the session's photos (≤ 6) and warnings, in photo order (one transaction). */
  async savePhotos(
    db: SqlDriver,
    sessionId: string,
    photos: Photo[],
    warnings: PhotoWarning[],
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM scan_photos WHERE session_id = ?', [sessionId]);
      for (const [i, p] of photos.entries()) {
        await db.runAsync(
          'INSERT INTO scan_photos (session_id, id, uri, label, idx, retaken) VALUES (?, ?, ?, ?, ?, ?)',
          [sessionId, p.id, p.uri, p.label ?? null, i, toSqlBool(p.retaken)],
        );
      }
      await replaceWarnings(db, sessionId, warnings);
    });
  },

  /** A new detection: replaces items + warnings and clears any earlier confirmation (one transaction). */
  async saveDetection(
    db: SqlDriver,
    sessionId: string,
    items: DetectedItem[],
    warnings: PhotoWarning[],
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      await replaceItems(db, sessionId, items);
      await replaceWarnings(db, sessionId, warnings);
      await setStatus(db, sessionId, 'detected', null);
    });
  },

  /** Rewrites the given items in place (value, unit, touched …), keeping their order. */
  async updateItems(db: SqlDriver, sessionId: string, items: DetectedItem[]): Promise<void> {
    await db.withTransactionAsync(async () => {
      for (const d of items) {
        await db.runAsync(
          `UPDATE scan_items SET name = ?, category = ?, unit = ?, min = ?, max = ?, step = ?, estimate = ?,
             value = ?, display_unit = ?, alt_unit = ?, confidence = ?, photo_index = ?, image_url = ?, touched = ?
           WHERE session_id = ? AND id = ?`,
          [...itemParams(sessionId, d, 0).slice(2, 16), sessionId, d.id],
        );
      }
    });
  },

  /** Appends an item (manual add). No-op if the id is already in the session. */
  async addItem(db: SqlDriver, sessionId: string, d: DetectedItem): Promise<void> {
    await db.runAsync(
      `INSERT INTO scan_items (session_id, ${ITEM_COLUMNS}, sort_order)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), -1) + 1
       FROM scan_items WHERE session_id = ?
       ON CONFLICT (session_id, id) DO NOTHING`,
      [...itemParams(sessionId, d, 0).slice(0, 16), sessionId],
    );
  },

  async removeItem(db: SqlDriver, sessionId: string, id: string): Promise<void> {
    await db.runAsync('DELETE FROM scan_items WHERE session_id = ? AND id = ?', [sessionId, id]);
  },

  setStatus,

  /** Deletes a session; its photos, items and warnings cascade. */
  async deleteSession(db: SqlDriver, id: string): Promise<void> {
    await db.runAsync('DELETE FROM scan_sessions WHERE id = ?', [id]);
  },
};
