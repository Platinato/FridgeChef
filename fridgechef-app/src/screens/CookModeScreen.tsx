import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { haptics } from '@/components/haptics';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { ListRow } from '@/components/ListRow';
import { LiveBadge } from '@/components/LiveBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { plural } from '@/domain/format';
import { defaultUsed, type UsedAmounts } from '@/domain/pantry';
import type { Recipe } from '@/domain/types';
import { useRecipe } from '@/services/queries';
import { useCookbookStore, useKitchen, usePantryStore, usePrefsStore } from '@/state';
import { spacing } from '@/theme/tokens';

/** A staple's "used" stepper moves in quarter recipe units (mockup CookMode). */
export const STAPLE_STEP = 0.25;
const STAPLE_MAX = 20;

const pad = (n: number) => String(n).padStart(2, '0');
/** 125 → "02:05". */
export const mmss = (seconds: number): string =>
  `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

/** The step timer: `endsAt` is set while it runs, so the count is right after any re-render. */
type Timer = { step: number; remaining: number; endsAt: number | null };

/** "Pantry updated · 2 items running low", or plain "Pantry updated". */
export const pantryToast = (newlyLow: number): string =>
  newlyLow ? `Pantry updated · ${plural(newlyLow, 'item')} running low` : 'Pantry updated';

/**
 * Cook mode (mockup screen 9): one step per screen, a real countdown per step, and "Done
 * cooking" → the "Nice work" sheet → deduct what was used → Home. Keeps the screen awake.
 */
export function CookModeScreen() {
  // Deactivating rejects when the lock never activated (web without the Wake Lock API, or an
  // Android activity that is gone); nothing to undo then, so swallow it.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/recipe/[id]', params: { id: id ?? '' } });

  if (!recipe.data) {
    return (
      <Screen testID="cook-screen">
        <TopBar left={<IconButton icon="close" label="Exit cook mode" onPress={back} />} />
        <QueryState
          loading={recipe.isLoading}
          errorMessage={recipe.errorMessage}
          onRetry={recipe.refetch}
          errorTitle="Couldn't load this recipe"
        >
          {null}
        </QueryState>
      </Screen>
    );
  }
  return <CookMode recipe={recipe.data} onExit={back} />;
}

function CookMode({ recipe: r, onExit }: { recipe: Recipe; onExit: () => void }) {
  const n = r.steps.length;
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [used, setUsed] = useState<UsedAmounts | null>(null);
  const kitchen = useKitchen();
  const servings = usePrefsStore((s) => s.servings);

  const i = Math.min(Math.max(index, 0), Math.max(n - 1, 0));
  const step = r.steps[i];
  const full = (step?.minutes ?? 0) * 60;
  const t = timer && timer.step === i ? timer : { step: i, remaining: full, endsAt: null };
  const running = t.endsAt !== null;
  const next = r.steps[i + 1];

  // Counts down from `endsAt`; at 0: stop, haptic, toast. Only the interval callback sets state.
  const endsAt = timer?.endsAt ?? null;
  useEffect(() => {
    if (endsAt === null) return;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (left > 0) {
        // Same second → same object, so React skips the render.
        setTimer((cur) =>
          cur && cur.endsAt === endsAt && cur.remaining !== left
            ? { ...cur, remaining: left }
            : cur,
        );
        return;
      }
      clearInterval(tick);
      setTimer((cur) =>
        cur && cur.endsAt === endsAt ? { ...cur, remaining: 0, endsAt: null } : cur,
      );
      haptics.success();
      showToast('Timer done - on to the next step');
    }, 250);
    return () => clearInterval(tick);
  }, [endsAt]);

  const toggleTimer = () => {
    if (running) {
      setTimer({ ...t, endsAt: null });
      return;
    }
    const remaining = t.remaining > 0 ? t.remaining : full;
    setTimer({ step: i, remaining, endsAt: Date.now() + remaining * 1000 });
  };

  const goTo = (target: number) => {
    setTimer(null);
    setIndex(target);
  };

  const finish = () => {
    setTimer(null);
    setUsed(defaultUsed(r, kitchen, servings));
  };

  return (
    <Screen
      testID="cook-screen"
      footerVariant="row"
      overlay={<NiceWorkSheet recipe={r} used={used} onChange={setUsed} />}
      footer={[
        <PrimaryButton
          key="back"
          label="Back"
          variant="outline"
          icon="back"
          disabled={i === 0}
          onPress={() => goTo(i - 1)}
        />,
        i < n - 1 ? (
          <PrimaryButton
            key="next"
            label="Next step"
            variant="lime"
            iconRight="chevronRight"
            onPress={() => goTo(i + 1)}
          />
        ) : (
          <PrimaryButton
            key="done"
            label="Done cooking"
            variant="lime"
            iconRight="check"
            onPress={finish}
          />
        ),
      ]}
    >
      <TopBar
        left={<IconButton icon="close" label="Exit cook mode" onPress={onExit} />}
        center={<Badge label={r.name} variant="dark" />}
        right={<IconButton icon="more" label="More" onPress={() => showToast('Coming soon')} />}
      />
      <ProgressBar
        value={i + 1}
        max={n || 1}
        label={`Step ${i + 1} of ${n}`}
        caption={`${r.timeMin} min total`}
      />
      <View style={styles.num} accessible accessibilityLabel={`Step ${i + 1} of ${n}`}>
        <AppText variant="display" size={150} color="lime" style={styles.numBig}>
          {pad(i + 1)}
        </AppText>
        <AppText variant="display" size={40} color="text2">
          {`/ ${pad(n)}`}
        </AppText>
      </View>
      <AppText variant="bodyL" weight={500} style={styles.text}>
        {step?.text ?? ''}
      </AppText>
      <View style={styles.timer}>
        <LiveBadge
          label={mmss(t.remaining)}
          size="lg"
          icon="timer"
          onPress={toggleTimer}
          accessibilityLabel={`Timer ${mmss(t.remaining)}, ${running ? 'running' : 'paused'}`}
          testID="cook-timer"
        />
        <AppText variant="caption">
          {running
            ? 'Tap to pause'
            : t.remaining === 0
              ? 'Done! Tap to restart'
              : 'Tap to start the timer'}
        </AppText>
      </View>
      {next ? (
        <InfoCard icon="chevronRight" title="Up next" body={next.text} />
      ) : (
        <InfoCard
          icon="check"
          variant="lime"
          title="Last step"
          body="Plate up - we’ll update your pantry after."
        />
      )}
    </Screen>
  );
}

/**
 * "Nice work": what was used (fresh items in their unit, staples in recipe units), editable,
 * then "Update pantry" deducts it, records the cook, goes Home and toasts the newly low count.
 */
function NiceWorkSheet({
  recipe,
  used,
  onChange,
}: {
  recipe: Recipe;
  used: UsedAmounts | null;
  onChange: (used: UsedAmounts | null) => void;
}) {
  const kitchen = useKitchen();
  const servings = usePrefsStore((s) => s.servings);
  const applyCooking = usePantryStore((s) => s.applyCooking);
  const recordCooked = useCookbookStore((s) => s.recordCooked);
  const busy = useRef(false);

  const update = async () => {
    if (!used || busy.current) return;
    busy.current = true;
    try {
      const { newlyLow } = await applyCooking(used);
      await recordCooked(recipe, servings);
      onChange(null);
      router.dismissTo('/');
      showToast(pantryToast(newlyLow.length));
    } finally {
      busy.current = false;
    }
  };

  const rows = Object.entries(used ?? {}).flatMap(([id, qty]) => {
    const d = kitchen.items.find((x) => x.id === id);
    const s = d ? undefined : kitchen.staples.find((x) => x.id === id);
    const item = d ?? s;
    if (!item) return [];
    return [{ id, qty, name: item.name, fresh: !!d, unit: d ? d.unit : s!.unit, d }];
  });

  return (
    <Sheet
      open={used !== null}
      onClose={() => onChange(null)}
      title="Nice work"
      footer={
        <PrimaryButton
          label="Update pantry"
          variant="lime"
          iconRight="check"
          onPress={() => void update()}
        />
      }
    >
      <View style={styles.sheet}>
        <AppText variant="body">
          We&apos;ll update your kitchen with what you used - adjust anything that&apos;s off.
        </AppText>
        <View style={styles.stack}>
          {rows.map((row) => (
            <ListRow
              key={row.id}
              label={row.name}
              detail={row.fresh ? 'fresh' : 'staple'}
              right={
                <Stepper
                  value={row.qty}
                  min={0}
                  max={row.d ? row.d.value : STAPLE_MAX}
                  step={row.d ? row.d.step : STAPLE_STEP}
                  unit={row.unit}
                  label={`${row.name} used`}
                  onChange={(v) => used && onChange({ ...used, [row.id]: v })}
                />
              }
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  num: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: spacing[2] },
  numBig: { lineHeight: 124 },
  text: { fontSize: 22, lineHeight: 31 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sheet: { gap: spacing[3] },
  stack: { gap: spacing[2] },
});
