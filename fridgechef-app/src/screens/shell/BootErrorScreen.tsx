import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import type { BootErrorKind } from '@/state';

const COPY: Record<BootErrorKind, { title: string; body: string }> = {
  unknown: {
    title: "Couldn't open your kitchen",
    body: "Something went wrong while loading your saved data. It's still on this phone - try again.",
  },
  // The database was written by a newer version of the app (`migrate` refused it untouched).
  app_outdated: {
    title: 'Update FridgeChef',
    body: 'Your kitchen was saved by a newer version of the app. Update FridgeChef to open it - nothing has been changed.',
  },
};

/** Shown when opening the on-device database fails. "Try again" reruns the whole boot. */
export function BootErrorScreen({
  retrying,
  onRetry,
  kind = 'unknown',
}: {
  retrying: boolean;
  onRetry: () => void;
  kind?: BootErrorKind | null;
}) {
  const copy = COPY[kind ?? 'unknown'];
  return (
    <Screen>
      <EmptyState
        icon="alert"
        title={copy.title}
        body={copy.body}
        actions={[
          {
            label: retrying ? 'Trying again' : 'Try again',
            variant: 'lime',
            disabled: retrying,
            onPress: onRetry,
          },
        ]}
      />
    </Screen>
  );
}
