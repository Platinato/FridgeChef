/// <reference types="node" />
/**
 * Content rules from the mockup design review (see CLAUDE.md / fridgechef-mockup/README.md).
 * Scans source files, so it also covers folders that later sprints add.
 */
import fs from 'node:fs';
import path from 'node:path';

import { iconNames } from '@/theme/icons';

const SRC = path.resolve(__dirname, '..');
const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/;

function walk(dir: string, skipTests = true): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipTests && entry.name === '__tests__') return [];
      return walk(full, skipTests);
    }
    return SOURCE_EXT.test(entry.name) ? [full] : [];
  });
}

const rel = (file: string) => path.relative(SRC, file).split(path.sep).join('/');

/** Returns "file:line: text" for every line matching `pattern`. */
function offenders(files: string[], pattern: RegExp) {
  return files.flatMap((file) =>
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, i) => (pattern.test(line) ? [`${rel(file)}:${i + 1}: ${line.trim()}`] : [])),
  );
}

// UI copy lives in components, screens and the seed modules (Sprints 04 and 05).
const COPY_DIRS = ['components', 'screens', 'db/seeds', 'services/api/mock/db/seed'].map((d) =>
  path.join(SRC, d),
);
// Built from the code point so no literal em dash ever lands in the repo.
const EM_DASH = new RegExp(String.fromCharCode(0x2014));
const STYLED_DIRS = ['components', 'screens'].map((d) => path.join(SRC, d));

describe('content rules', () => {
  it('scans a non-empty source tree', () => {
    expect(walk(SRC).length).toBeGreaterThan(10);
    expect(walk(path.join(SRC, 'components')).length).toBeGreaterThan(10);
  });

  it('never uses an em dash (U+2014) anywhere in src/', () => {
    expect(offenders(walk(SRC), EM_DASH)).toEqual([]);
  });

  it('never shows the word "AI" in components, screens or seed data', () => {
    expect(
      offenders(
        COPY_DIRS.flatMap((d) => walk(d)),
        /\bAI\b/,
      ),
    ).toEqual([]);
  });

  it('has no play-button icon', () => {
    expect(iconNames).not.toContain('play');
    expect(
      offenders(
        COPY_DIRS.flatMap((d) => walk(d)),
        /(name|icon|iconRight)=["']play["']/,
      ),
    ).toEqual([]);
  });

  it('keeps components presentational (no state, services, mocks or db imports)', () => {
    const files = walk(path.join(SRC, 'components'), false);
    expect(offenders(files, /from '(@|\.\.)\/(state|services|mocks|db)(\/|')/)).toEqual([]);
  });

  it('keeps colour literals out of components and screens (use theme/tokens.ts)', () => {
    const files = STYLED_DIRS.flatMap((d) => walk(d));
    expect(offenders(files, /#[0-9A-Fa-f]{3,8}\b/)).toEqual([]);
    expect(offenders(files, /\brgba?\(|\bhsla?\(/)).toEqual([]);
  });
});
