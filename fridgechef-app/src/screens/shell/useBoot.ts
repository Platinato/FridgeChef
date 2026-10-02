import { useEffect, useState } from 'react';

import { bootApp, bootErrorKind, type BootErrorKind } from '@/state';

export type BootStatus = 'booting' | 'ready' | 'failed';

export type Boot = {
  status: BootStatus;
  /** A boot has failed at least once (the splash is gone; show the error screen while retrying). */
  failedOnce: boolean;
  /** Why the last boot failed (null until one does). */
  errorKind: BootErrorKind | null;
  /** Runs the boot again (the error screen's "Try again"). */
  retry: () => void;
};

/**
 * Runs the app boot (open + migrate + seed the database, then hydrate the stores) once, and
 * again on `retry()`. Never renders screens over un-hydrated stores: callers wait for `ready`.
 */
export function useBoot(boot: () => Promise<void> = bootApp): Boot {
  const [status, setStatus] = useState<BootStatus>('booting');
  const [failedOnce, setFailedOnce] = useState(false);
  const [errorKind, setErrorKind] = useState<BootErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    boot().then(
      () => {
        if (alive) setStatus('ready');
      },
      (error: unknown) => {
        console.error('[boot] failed', error);
        if (!alive) return;
        setFailedOnce(true);
        setErrorKind(bootErrorKind(error));
        setStatus('failed');
      },
    );
    return () => {
      alive = false;
    };
  }, [boot, attempt]);

  return {
    status,
    failedOnce,
    errorKind,
    retry: () => {
      setStatus('booting');
      setAttempt((n) => n + 1);
    },
  };
}
