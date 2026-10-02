import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { ChipRow } from '@/components/ChipRow';
import { CounterPill } from '@/components/CounterPill';
import { EmptyState } from '@/components/EmptyState';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { PantryItem } from '@/components/PantryItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuantitySlider } from '@/components/QuantitySlider';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { TopBar } from '@/components/TopBar';
import { plural } from '@/domain/format';
import { stapleOn } from '@/domain/pantry';
import { sortByConfidence } from '@/domain/scan';
import type { DetectedItem } from '@/domain/types';
import { displayOf, unitsOf } from '@/domain/units';
import { useCatalog } from '@/services/queries';
import { usePantryStore, usePendingChecks, useScanStore } from '@/state';
import { activeWarning, warningBody } from '@/screens/scanShared';
import { spacing } from '@/theme/tokens';

const toCamera = () => (router.canGoBack() ? router.back() : router.replace('/scan'));

/**
 * Confirm / QUANTITIES (mockup screen 5): the gate. A slider card per item (low → med → high →
 * manual); recipes wait until every low-confidence item is checked. Then `confirmScan()` → Mood.
 */
export function ConfirmScreen() {
  const items = useScanStore((s) => s.items);
  const photos = useScanStore((s) => s.photos);
  const warnings = useScanStore((s) => s.warnings);
  const setQty = useScanStore((s) => s.setQty);
  const setUnit = useScanStore((s) => s.setUnit);
  const confirmItem = useScanStore((s) => s.confirmItem);
  const removeItem = useScanStore((s) => s.removeItem);
  const confirmScan = useScanStore((s) => s.confirmScan);
  const pending = usePendingChecks();
  const [adding, setAdding] = useState(false);

  const sorted = useMemo(() => sortByConfidence(items), [items]);
  const warn = activeWarning(photos, warnings);
  const blocked = pending.length > 0 || items.length === 0;

  const onRemove = (item: DetectedItem) => {
    void removeItem(item.id);
    showToast(`Removed ${item.name}`);
  };

  const confirm = async () => {
    if (blocked) return;
    // A failed write already toasts; the in-memory session is confirmed either way.
    await confirmScan();
    router.push('/mood');
  };

  return (
    <Screen
      testID="confirm-screen"
      overlay={<AddItemSheet open={adding} onClose={() => setAdding(false)} />}
      footer={
        <PrimaryButton
          label={
            pending.length ? `Check ${plural(pending.length, 'item')} first` : 'Confirm quantities'
          }
          variant="lime"
          iconRight={pending.length ? undefined : 'check'}
          disabled={blocked}
          onPress={() => void confirm()}
        />
      }
    >
      <TopBar
        left={<IconButton icon="back" label="Back" onPress={toCamera} />}
        center={<CounterPill icon="basket" value={plural(items.length, 'item')} />}
        right={<IconButton icon="plus" label="Add missed item" onPress={() => setAdding(true)} />}
      />
      <HeroTitle kicker="Confirm" title="Quantities" size={80} />
      <AppText variant="body">
        Photos can be tricky. Slide to the real amount so recipes fit what you actually have.
      </AppText>
      <View style={styles.badges}>
        {pending.length ? (
          <Badge label={`${pending.length} need a check`} dot="red" variant="alert" />
        ) : null}
        <Badge label={`${items.length - pending.length} look good`} icon="check" variant="dark" />
      </View>
      {warn ? (
        <InfoCard
          icon="alert"
          variant="alert"
          title={warn.warning.message}
          body={warningBody(warn.warning)}
          right={
            <PrimaryButton
              label="Retake"
              variant="light"
              size="xs"
              full={false}
              onPress={toCamera}
            />
          }
        />
      ) : null}

      {sorted.length > 0 ? (
        <View style={styles.sliders}>
          {sorted.map((item) => (
            <QuantityRow
              key={item.id}
              item={item}
              onQty={setQty}
              onUnit={setUnit}
              onConfirm={confirmItem}
              onRemove={onRemove}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="camera"
          title="Nothing found"
          body="Try another photo with better light."
          actions={[{ label: 'Back to camera', variant: 'lime', onPress: toCamera }]}
        />
      )}
      <PrimaryButton
        label="Add missed item"
        icon="plus"
        variant="outline"
        onPress={() => setAdding(true)}
      />
      <PantrySection />
    </Screen>
  );
}

type QuantityRowProps = {
  item: DetectedItem;
  onQty: (id: string, value: number) => unknown;
  onUnit: (id: string, unit: string) => unknown;
  onConfirm: (id: string) => unknown;
  onRemove: (item: DetectedItem) => void;
};

/**
 * One slider card. Memoised on the item: dragging only updates the card's own live value
 * (QuantitySlider keeps it), and the store is written once, on release.
 */
const QuantityRow = memo(function QuantityRow({
  item,
  onQty,
  onUnit,
  onConfirm,
  onRemove,
}: QuantityRowProps) {
  const v = displayOf(item);
  return (
    <QuantitySlider
      name={item.name}
      thumb={item.imageUrl}
      confidence={item.confidence === 'manual' ? undefined : item.confidence}
      touched={item.touched}
      value={v.value}
      min={v.min}
      max={v.max}
      step={v.step}
      unit={v.unit}
      units={item.altUnit ? unitsOf(item) : undefined}
      estimate={v.estimate ?? undefined}
      onChange={(value) => void onQty(item.id, value)}
      onUnitChange={(unit) => void onUnit(item.id, unit)}
      onConfirm={() => void onConfirm(item.id)}
      onRemove={() => onRemove(item)}
    />
  );
});

/** "From your pantry": remembered staples, auto-included (each can be switched off). */
function PantrySection() {
  const staples = usePantryStore((s) => s.staples);
  const autoInclude = usePantryStore((s) => s.autoInclude);
  const excluded = usePantryStore((s) => s.excluded);
  const toggleIncluded = usePantryStore((s) => s.toggleIncluded);
  const setAutoInclude = usePantryStore((s) => s.setAutoInclude);
  const [open, setOpen] = useState(true);
  const included = staples.filter((s) => stapleOn(s, { autoInclude, excluded })).length;

  return (
    <>
      <SectionHeader
        title="From your pantry"
        count={included}
        right={
          <IconButton
            icon={open ? 'chevronUp' : 'chevronDown'}
            label={open ? 'Collapse pantry' : 'Expand pantry'}
            size={40}
            onPress={() => setOpen((o) => !o)}
          />
        }
      />
      {open && autoInclude ? (
        <>
          <AppText variant="caption">Auto-included · you don&apos;t need to scan these.</AppText>
          <View style={styles.stack}>
            {staples.map((s) => (
              <PantryItem
                key={s.id}
                item={s}
                toggle={{ on: !excluded[s.id], onChange: () => void toggleIncluded(s.id) }}
              />
            ))}
          </View>
        </>
      ) : null}
      {open && !autoInclude ? (
        <InfoCard
          icon="pantry"
          title="Auto-include is off"
          body="Turn it on to count your remembered spices & basics."
          footer={
            <Toggle
              on={false}
              label="Auto-include pantry staples"
              onChange={(on) => void setAutoInclude(on)}
            />
          }
        />
      ) : null}
    </>
  );
}

/** "Add missed item": search the catalog's addable items not already on the list; tap to add. */
function AddItemSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catalog = useCatalog();
  const items = useScanStore((s) => s.items);
  const addManualItem = useScanStore((s) => s.addManualItem);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const options = (catalog.data?.addableItems ?? [])
    .filter((a) => !items.some((d) => d.id === a.id))
    .filter((a) => !q || a.name.toLowerCase().includes(q));

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Add missed item">
      <View style={styles.sheetBody}>
        <SearchField
          inSheet
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients"
        />
        <QueryState
          loading={catalog.isLoading}
          errorMessage={catalog.errorMessage}
          onRetry={catalog.refetch}
          placeholder="chips"
          errorTitle="Couldn't load ingredients"
        >
          {options.length > 0 ? (
            <ChipRow
              wrap
              chips={options.map((a) => ({
                key: a.id,
                label: a.name,
                icon: 'plus',
                onPress: () => {
                  void addManualItem(a);
                  close();
                  showToast(`Added ${a.name}`);
                },
              }))}
            />
          ) : (
            <AppText variant="caption">
              {q ? 'No ingredients match that search.' : 'Everything is already on your list.'}
            </AppText>
          )}
        </QueryState>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  sliders: { gap: spacing[4] },
  stack: { gap: spacing[2] },
  sheetBody: { gap: spacing[3] },
});
