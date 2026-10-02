import type { Migration } from '../migrate';
import { init } from './0001_init';

/** fridgechef.db migrations, oldest first. Append only. */
export const migrations: readonly Migration[] = [init];

export const LATEST_VERSION = migrations.length;
