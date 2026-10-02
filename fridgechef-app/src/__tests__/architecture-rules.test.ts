/// <reference types="node" />
/**
 * Layering rules for the domain / database / state code (Sprint 04 acceptance criteria,
 * sprints/reference/architecture.md → Local database). Scans source files, so new files are covered.
 */
import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve(__dirname, '../..');
const SRC = path.join(APP, 'src');
const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/;
const isTest = (file: string) => /[\\/]__tests__[\\/]/.test(file);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const rel = (file: string) => path.relative(SRC, file).split(path.sep).join('/');
const sources = (dir = SRC) => walk(dir).filter((f) => SOURCE_EXT.test(f));
const appSources = () => sources().filter((f) => !isTest(f));
const read = (file: string) => fs.readFileSync(file, 'utf8');

/** Module specifiers a file imports (static, dynamic, require, export-from). */
function importsOf(file: string): string[] {
  const text = read(file);
  const found: string[] = [];
  for (const m of text.matchAll(/(?:from|import|require\()\s*\(?\s*['"]([^'"]+)['"]/g)) {
    found.push(m[1]!);
  }
  return found;
}

/** "file: specifier" for every import matching `pattern`. */
const importOffenders = (files: string[], pattern: RegExp) =>
  files.flatMap((f) =>
    importsOf(f).flatMap((spec) => (pattern.test(spec) ? [`${rel(f)}: ${spec}`] : [])),
  );

describe('architecture rules', () => {
  it('scans a non-empty tree', () => {
    expect(sources(path.join(SRC, 'domain')).length).toBeGreaterThan(5);
    expect(sources(path.join(SRC, 'db')).length).toBeGreaterThan(10);
  });

  it('src/domain imports nothing from React, RN, state, db, services or mocks', () => {
    const domain = sources(path.join(SRC, 'domain')).filter((f) => !isTest(f));
    expect(
      importOffenders(
        domain,
        /^(react|react-native|expo|zustand)(\/|$)|^@\/(state|db|services|mocks|components|screens|theme)(\/|$)|^\.\.\//,
      ),
    ).toEqual([]);
  });

  it('expo-sqlite is imported only in src/db/client.ts', () => {
    expect(importOffenders(sources(), /^expo-sqlite(\/|$)/)).toEqual(['db/client.ts: expo-sqlite']);
  });

  it('node:sqlite and db/testing are only used by tests and db/testing itself', () => {
    const app = appSources().filter(
      (f) => !rel(f).startsWith('db/testing/') && !rel(f).startsWith('testing/'),
    );
    expect(importOffenders(app, /^node:sqlite$|db\/testing|^@\/testing\//)).toEqual([]);
  });

  it('SQL lives only in db/repositories, db/migrations (and the mock backend db)', () => {
    const SQL =
      /\b(SELECT\s|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|TRIGGER)|DROP\s+TABLE)/;
    const allowed = /^(db\/repositories|db\/migrations|services\/api\/mock\/db)\//;
    const offenders = appSources()
      .filter((f) => !allowed.test(rel(f)))
      .flatMap((f) =>
        read(f)
          .split(/\r?\n/)
          .flatMap((line, i) => (SQL.test(line) ? [`${rel(f)}:${i + 1}: ${line.trim()}`] : [])),
      );
    expect(offenders).toEqual([]);
  });

  it('screens, components and routes never import src/db', () => {
    const ui = ['app', 'screens', 'components'].flatMap((d) => sources(path.join(SRC, d)));
    expect(importOffenders(ui, /^@\/db(\/|$)/)).toEqual([]);
  });

  it('there are no .json data files under src/', () => {
    expect(
      walk(SRC)
        .filter((f) => f.endsWith('.json'))
        .map(rel),
    ).toEqual([]);
  });

  it('AsyncStorage is gone (D14)', () => {
    const files = [
      path.join(APP, 'package.json'),
      path.join(APP, 'jest.setup.ts'),
      path.join(APP, 'jest.config.js'),
      ...sources(),
    ].filter((f) => f !== __filename);
    const hits = files
      .filter((f) => /async-storage|AsyncStorage/.test(read(f)))
      .map((f) => path.relative(APP, f));
    expect(hits).toEqual([]);
  });

  it('stores never use the zustand persist middleware', () => {
    expect(importOffenders(sources(path.join(SRC, 'state')), /^zustand\/middleware/)).toEqual([]);
  });
});

/** Sprint 05: the API seam (architecture.md → The API seam). Test-only code is exempt. */
describe('API seam', () => {
  const isTestOnly = (f: string) =>
    isTest(f) || rel(f).startsWith('db/testing/') || rel(f).startsWith('testing/');
  const outsideApi = () =>
    sources().filter((f) => !isTestOnly(f) && !rel(f).startsWith('services/api/'));

  it('nothing outside services/api imports the mock backend or HttpApi', () => {
    expect(
      importOffenders(outsideApi(), /(^|\/)api\/(mock|http)(\/|$)|(^|\/)(MockApi|HttpApi)$/),
    ).toEqual([]);
  });

  it('nothing outside services/api calls fetch', () => {
    const offenders = outsideApi().flatMap((f) =>
      read(f)
        .split(/\r?\n/)
        .flatMap((line, i) => (/\bfetch\s*\(/.test(line) ? [`${rel(f)}:${i + 1}`] : [])),
    );
    expect(offenders).toEqual([]);
  });

  it('inside services/api only http/request.ts calls fetch, and only index.ts builds the APIs', () => {
    const api = sources(path.join(SRC, 'services/api')).filter((f) => !isTestOnly(f));
    const grep = (pattern: RegExp) => api.filter((f) => pattern.test(read(f))).map(rel);
    expect(grep(/\bfetch\s*\(/)).toEqual(['services/api/http/request.ts']);
    expect(grep(/new\s+(MockApi|HttpApi)\s*\(/)).toEqual(['services/api/index.ts']);
  });

  it('docs/api-contract.md is a verbatim copy of sprints/reference/api-contract.md', () => {
    const reference = path.join(APP, '..', 'sprints', 'reference', 'api-contract.md');
    expect(read(path.join(APP, 'docs', 'api-contract.md'))).toBe(read(reference));
  });

  it('the mock database is opened only through services/api/mock/db/mockDb.ts', () => {
    const openers = appSources()
      .filter((f) => !isTestOnly(f) && /openDatabaseByName\s*\(/.test(read(f)))
      .map(rel);
    expect(openers.sort()).toEqual(['db/client.ts', 'services/api/mock/db/mockDb.ts']);
  });
});
