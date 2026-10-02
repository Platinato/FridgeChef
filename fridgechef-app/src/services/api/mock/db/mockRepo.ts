/**
 * The ONLY place mock SQL lives. Returns raw wire DTOs (`unknown`, straight from JSON), which
 * MockApi then parses with the contract schemas exactly like a network response.
 */
import type { SqlDriver } from '@/db/driver';

import { insertSeed } from './schema';

type DtoRow = { dto: string };

const parse = (row: DtoRow): unknown => JSON.parse(row.dto);

export const mockRepo = {
  async catalog(db: SqlDriver): Promise<unknown | null> {
    const row = await db.getFirstAsync<DtoRow>('SELECT dto FROM mock_catalog WHERE id = 1');
    return row ? parse(row) : null;
  },

  /** Items spotted in the first `photoCount` photos, in seed order. */
  async detections(db: SqlDriver, photoCount: number): Promise<unknown[]> {
    const rows = await db.getAllAsync<DtoRow>(
      'SELECT dto FROM mock_detections WHERE photo_index < ? ORDER BY sort_order',
      [photoCount],
    );
    return rows.map(parse);
  },

  async recipes(db: SqlDriver): Promise<unknown[]> {
    const rows = await db.getAllAsync<DtoRow>('SELECT dto FROM mock_recipes ORDER BY sort_order');
    return rows.map(parse);
  },

  async recipe(db: SqlDriver, id: string): Promise<unknown | null> {
    const row = await db.getFirstAsync<DtoRow>('SELECT dto FROM mock_recipes WHERE id = ?', [id]);
    return row ? parse(row) : null;
  },

  async demoPhotos(db: SqlDriver): Promise<unknown[]> {
    const rows = await db.getAllAsync<DtoRow>(
      'SELECT dto FROM mock_demo_photos ORDER BY sort_order',
    );
    return rows.map(parse);
  },

  async counts(db: SqlDriver): Promise<Record<string, number>> {
    const count = async (table: string) =>
      (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n ?? 0;
    return {
      catalog: await count('mock_catalog'),
      detections: await count('mock_detections'),
      recipes: await count('mock_recipes'),
      demoPhotos: await count('mock_demo_photos'),
    };
  },

  /** Deletes every mock row and reinserts the seed, in one transaction. */
  async reseed(db: SqlDriver): Promise<void> {
    await db.withTransactionAsync(async () => {
      for (const table of ['mock_catalog', 'mock_detections', 'mock_recipes', 'mock_demo_photos']) {
        await db.runAsync(`DELETE FROM ${table}`);
      }
      await insertSeed(db);
    });
  },
};
