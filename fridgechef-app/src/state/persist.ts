/**
 * Write-through plumbing for the stores. Every write goes through one queue, so writes reach
 * SQLite in the order the actions ran and never interleave with another action's transaction
 * (expo-sqlite pulls any statement that runs during an open transaction into it).
 */
import { getDb } from '@/db/client';
import type { SqlDriver } from '@/db/driver';

type WriteErrorReporter = (label: string, error: unknown) => void;

let reporter: WriteErrorReporter | null = null;
let tail: Promise<unknown> = Promise.resolve();

/** How a failed write is surfaced to the user (the root layout plugs in a toast, Sprint 06). */
export function setWriteErrorReporter(next: WriteErrorReporter | null): void {
  reporter = next;
}

/** Runs `task` after every earlier queued task has settled. */
export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task);
  tail = run.catch(() => undefined);
  return run;
}

/** Resolves once every write queued so far has settled. */
export const flushWrites = (): Promise<void> => enqueue(async () => undefined);

/**
 * Queues a repository write. Never rejects: a failure is logged and reported (toast) and the
 * promise resolves `false`, so fire-and-forget callers can't cause an unhandled rejection.
 * The store has already updated, so the UI keeps the new value for this session.
 */
export async function writeThrough(
  label: string,
  task: (db: SqlDriver) => Promise<unknown>,
): Promise<boolean> {
  try {
    await enqueue(() => task(getDb()));
    return true;
  } catch (error) {
    console.error(`[db] ${label} failed`, error);
    reporter?.(label, error);
    return false;
  }
}

export const nowIso = (): string => new Date().toISOString();

/** A local id such as `scn_mg1x2k9f4q7h`. */
export const newId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
