import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DetectedChip } from '@/components/DetectedChip';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { LiveBadge } from '@/components/LiveBadge';
import { PhotoStack } from '@/components/PhotoStack';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import type { DetectedItem } from '@/domain/types';
import { prepareImages } from '@/services/media';
import { errorMessageOf, isCancelled, useDetectIngredients } from '@/services/queries';
import { usePantryStore, useProfileStore, useScanStore } from '@/state';
import { deviceLocale } from '@/screens/scanShared';
import { spacing } from '@/theme/tokens';

/** One chip pops in every 230 ms once the reply is in (the mockup's analyzing tick). */
export const REVEAL_MS = 230;
/** Pause on "Scan complete" before moving on to Confirm. */
export const ADVANCE_MS = 900;

type Phase =
  | { kind: 'working' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: DetectedItem[] };

const toConfirm = () => router.replace('/scan/confirm');
const toCamera = () => (router.canGoBack() ? router.back() : router.replace('/scan'));

/**
 * Analyzing (mockup screen 4): prepares the photos, runs detection (written to the scan store by
 * `useDetectIngredients`), reveals the chips one by one, then replaces itself with Confirm.
 * Leaving the screen aborts both steps; nothing is written for an aborted scan.
 */
export function AnalyzingScreen() {
  const photos = useScanStore((s) => s.photos);
  const staples = usePantryStore((s) => s.staples);
  const units = useProfileStore((s) => s.profile.units);
  const { detectAsync } = useDetectIngredients();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: 'working' });
  const [found, setFound] = useState(0);

  // Sees the latest photos / staples / units when it runs, without re-running the effect on changes.
  const detect = useEffectEvent(async (signal: AbortSignal): Promise<DetectedItem[] | null> => {
    if (photos.length === 0) return null;
    const images = await prepareImages(photos, signal);
    const result = await detectAsync(
      {
        images: images.map(({ id, mimeType, base64 }) => ({ id, mimeType, base64 })),
        knownStapleIds: staples.map((s) => s.id),
        locale: deviceLocale(),
        units,
      },
      { signal },
    );
    return result.items;
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    detect(signal).then(
      (items) => {
        if (items && !signal.aborted) setPhase({ kind: 'ready', items });
      },
      (error: unknown) => {
        if (signal.aborted || isCancelled(error)) return;
        console.warn('[scan] detection failed', error);
        setPhase({ kind: 'error', message: errorMessageOf(error) });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  // The staggered reveal, then the auto-advance.
  const total = phase.kind === 'ready' ? phase.items.length : 0;
  const done = phase.kind === 'ready' && found >= total;
  useEffect(() => {
    if (phase.kind !== 'ready') return;
    const timer =
      found < total
        ? setTimeout(() => setFound((n) => n + 1), REVEAL_MS)
        : setTimeout(toConfirm, ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [phase, found, total]);

  const retry = () => {
    setPhase({ kind: 'working' });
    setFound(0);
    setAttempt((n) => n + 1);
  };

  const topBar = (
    <TopBar
      left={<IconButton icon="back" label="Back to camera" onPress={toCamera} />}
      center={<LiveBadge label={done ? 'Scan complete' : 'Scanning'} />}
      right={
        phase.kind === 'ready' ? (
          <PrimaryButton label="Skip" variant="ghost" size="sm" full={false} onPress={toConfirm} />
        ) : null
      }
    />
  );

  if (photos.length === 0 || phase.kind === 'error') {
    return (
      <Screen testID="analyzing-screen">
        {topBar}
        <EmptyState
          icon={photos.length === 0 ? 'camera' : 'alert'}
          title={photos.length === 0 ? 'No photos yet' : "Couldn't scan your photos"}
          body={
            phase.kind === 'error'
              ? phase.message
              : 'Take or upload at least one photo to continue.'
          }
          actions={[
            ...(phase.kind === 'error'
              ? [{ key: 'retry', label: 'Try again', variant: 'lime' as const, onPress: retry }]
              : []),
            {
              key: 'camera',
              label: 'Back to camera',
              variant: phase.kind === 'error' ? ('outline' as const) : ('lime' as const),
              onPress: toCamera,
            },
          ]}
        />
      </Screen>
    );
  }

  const shown = phase.kind === 'ready' ? phase.items.slice(0, found) : [];

  return (
    <Screen testID="analyzing-screen">
      {topBar}
      <PhotoStack
        photos={photos.map((p, i) => ({
          id: p.id,
          uri: p.uri,
          label: p.label ?? `Photo ${i + 1}`,
        }))}
        scanning={!done}
      />
      <View
        style={styles.count}
        accessible
        accessibilityLabel={phase.kind === 'ready' ? `${found} of ${total} found` : 'Scanning'}
        accessibilityLiveRegion="polite"
      >
        <AppText variant="display" size={64} color="lime" style={styles.countNum}>
          {phase.kind === 'ready' ? `${found} / ${total}` : '0'}
        </AppText>
        <AppText variant="display" size={28} color="text2">
          found
        </AppText>
      </View>
      <ProgressBar value={found} max={total || 1} indeterminate={phase.kind === 'working'} />
      <View style={styles.chips}>
        {shown.map((d, i) => (
          <DetectedChip
            key={d.id}
            name={d.name}
            confidence={d.confidence === 'manual' ? undefined : d.confidence}
            animate
            connector={i > 0}
          />
        ))}
      </View>
      <AppText variant="caption">
        {done
          ? 'Next: check the amounts - a photo can’t tell 400 g from 700 g.'
          : 'Reading labels, shapes and packaging…'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: spacing[5] },
  countNum: { lineHeight: 58 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, minHeight: 92 },
});
