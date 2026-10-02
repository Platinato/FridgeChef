/**
 * Schema v1 of fridgechef.db (see sprints/reference/architecture.md → Local database).
 * SHIPPED MIGRATIONS ARE NEVER EDITED: change the schema in a new numbered file.
 */
import type { Migration } from '../migrate';

export const init: Migration = {
  version: 1,
  name: '0001_init',
  up: (db) =>
    db.execAsync(`
      CREATE TABLE app_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE profile (
        id             INTEGER PRIMARY KEY CHECK (id = 1),
        name           TEXT NOT NULL,
        diet           TEXT NOT NULL,
        allergies      TEXT NOT NULL DEFAULT '[]',
        household_size INTEGER NOT NULL CHECK (household_size >= 1),
        units          TEXT NOT NULL,
        default_effort TEXT NOT NULL,
        updated_at     TEXT NOT NULL
      );

      CREATE TABLE preferences (
        id         INTEGER PRIMARY KEY CHECK (id = 1),
        mood       TEXT NOT NULL,
        time_min   INTEGER NOT NULL,
        effort     TEXT NOT NULL,
        servings   INTEGER NOT NULL CHECK (servings >= 1),
        hunger     TEXT NOT NULL,
        diet       TEXT NOT NULL,
        spice      INTEGER NOT NULL,
        filter     TEXT NOT NULL,
        sort       TEXT NOT NULL,
        cuisines   TEXT NOT NULL DEFAULT '["Any"]',
        equipment  TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE staples (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        category   TEXT NOT NULL,
        unit       TEXT NOT NULL,
        unit_hint  TEXT NOT NULL,
        per_level  REAL NOT NULL CHECK (per_level > 0),
        level      REAL NOT NULL CHECK (level BETWEEN 0 AND 5),
        included   INTEGER NOT NULL DEFAULT 1 CHECK (included IN (0, 1)),
        updated_at TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );
      CREATE INDEX staples_by_sort_order ON staples (sort_order);

      CREATE TABLE scan_sessions (
        id           TEXT PRIMARY KEY NOT NULL,
        created_at   TEXT NOT NULL,
        confirmed_at TEXT,
        status       TEXT NOT NULL CHECK (status IN ('draft', 'detected', 'confirmed'))
      );
      CREATE INDEX scan_sessions_by_created_at ON scan_sessions (created_at);

      CREATE TABLE scan_photos (
        session_id TEXT NOT NULL REFERENCES scan_sessions (id) ON DELETE CASCADE,
        id         TEXT NOT NULL,
        uri        TEXT NOT NULL,
        label      TEXT,
        idx        INTEGER NOT NULL,
        retaken    INTEGER NOT NULL DEFAULT 0 CHECK (retaken IN (0, 1)),
        PRIMARY KEY (session_id, id)
      );
      CREATE INDEX scan_photos_by_session_idx ON scan_photos (session_id, idx);

      CREATE TABLE scan_items (
        session_id   TEXT NOT NULL REFERENCES scan_sessions (id) ON DELETE CASCADE,
        id           TEXT NOT NULL,
        name         TEXT NOT NULL,
        category     TEXT NOT NULL,
        unit         TEXT NOT NULL,
        min          REAL NOT NULL,
        max          REAL NOT NULL,
        step         REAL NOT NULL CHECK (step > 0),
        estimate     REAL,
        value        REAL NOT NULL,
        display_unit TEXT NOT NULL,
        alt_unit     TEXT,
        confidence   TEXT NOT NULL CHECK (confidence IN ('high', 'med', 'low', 'manual')),
        photo_index  INTEGER,
        image_url    TEXT,
        touched      INTEGER NOT NULL DEFAULT 0 CHECK (touched IN (0, 1)),
        sort_order   INTEGER NOT NULL,
        PRIMARY KEY (session_id, id)
      );
      CREATE INDEX scan_items_by_session_order ON scan_items (session_id, sort_order);

      CREATE TABLE scan_warnings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT NOT NULL REFERENCES scan_sessions (id) ON DELETE CASCADE,
        photo_index INTEGER NOT NULL,
        type        TEXT NOT NULL CHECK (type IN ('blurry', 'dark', 'no_food')),
        message     TEXT NOT NULL
      );
      CREATE INDEX scan_warnings_by_session ON scan_warnings (session_id, photo_index);

      CREATE TABLE recipe_snapshots (
        id         TEXT PRIMARY KEY NOT NULL,
        recipe     TEXT NOT NULL,
        fetched_at TEXT NOT NULL
      );

      CREATE TABLE saved_recipes (
        recipe_id TEXT PRIMARY KEY NOT NULL REFERENCES recipe_snapshots (id) ON DELETE CASCADE,
        saved_at  TEXT NOT NULL
      );
      CREATE INDEX saved_recipes_by_saved_at ON saved_recipes (saved_at);

      CREATE TABLE cooked_history (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL REFERENCES recipe_snapshots (id) ON DELETE CASCADE,
        servings  INTEGER NOT NULL CHECK (servings >= 1),
        cooked_at TEXT NOT NULL
      );
      CREATE INDEX cooked_history_by_recipe ON cooked_history (recipe_id);
    `),
};
