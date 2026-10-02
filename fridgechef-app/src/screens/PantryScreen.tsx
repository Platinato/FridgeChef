import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { ChipRow } from '@/components/ChipRow';
import { CounterPill } from '@/components/CounterPill';
import { EmptyState } from '@/components/EmptyState';
import { HeroTitle } from '@/components/HeroTitle';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { LevelBars } from '@/components/LevelBars';
import { ListRow } from '@/components/ListRow';
import { PantryItem } from '@/components/PantryItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { TopBar } from '@/components/TopBar';
import { plural, timeAgo } from '@/domain/format';
import { FULL_LEVEL, isLow } from '@/domain/pantry';
import type { Staple } from '@/domain/types';
import { useCatalog } from '@/services/queries';
import { usePantryStore } from '@/state';
import { ALL_CATEGORIES, pantryCategories } from '@/screens/shared';
import { spacing } from '@/theme/tokens';

type SheetState = { kind: 'staple'; id: string } | { kind: 'add' } | null;

/** Pantry: "My / PANTRY" (mockup screen 10). `?staple=<id>` opens that staple's sheet. */
export function PantryScreen() {
  const { staple: stapleParam } = useLocalSearchParams<{ staple?: string }>();
  const staples = usePantryStore((s) => s.staples);
  const autoInclude = usePantryStore((s) => s.autoInclude);
  const setAutoInclude = usePantryStore((s) => s.setAutoInclude);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sheet, setSheet] = useState<SheetState>(null);

  // Home's "Running low" cards link here with ?staple=<id>: open that sheet (adjusting state
  // during render, once per param), then clear the param so the same link works next time.
  const [handled, setHandled] = useState<string | undefined>();
  if (stapleParam !== handled) {
    setHandled(stapleParam);
    if (stapleParam) setSheet({ kind: 'staple', id: stapleParam });
  }
  useEffect(() => {
    if (stapleParam) router.setParams({ staple: undefined });
  }, [stapleParam]);

  const list = useMemo(
    () => staples.filter((s) => category === ALL_CATEGORIES || s.category === category),
    [staples, category],
  );
  const low = list.filter(isLow);
  const rest = list.filter((s) => !isLow(s));
  const open = (s: Staple) => setSheet({ kind: 'staple', id: s.id });
  const rows = (items: Staple[]) => (
    <View style={styles.stack}>
      {items.map((s) => (
        <PantryItem
          key={s.id}
          item={s}
          low={isLow(s)}
          updatedLabel={timeAgo(s.updatedAt)}
          onPress={() => open(s)}
        />
      ))}
    </View>
  );

  const editing = sheet?.kind === 'staple' ? staples.find((s) => s.id === sheet.id) : undefined;

  return (
    <Screen
      withNav
      overlay={
        <>
          <LevelSheet staple={editing} onClose={() => setSheet(null)} />
          <AddStapleSheet open={sheet?.kind === 'add'} onClose={() => setSheet(null)} />
        </>
      }
    >
      <TopBar
        left={<AppLogo size={50} />}
        right={
          <IconButton
            icon="plus"
            label="Add staple"
            variant="lime"
            onPress={() => setSheet({ kind: 'add' })}
          />
        }
      />
      <HeroTitle
        kicker="My"
        title="Pantry"
        right={<CounterPill icon="pantry" value={plural(staples.length, 'staple')} />}
      />
      {/* Content rule: this card has no icon. */}
      <InfoCard
        title="Staples are remembered"
        body="Spices, oils & basics used in small amounts are tracked here and auto-included in every scan."
        footer={
          <Toggle
            on={autoInclude}
            label="Auto-include in scans"
            sub="Counted in every recipe match"
            onChange={setAutoInclude}
          />
        }
      />
      <ChipRow
        chips={pantryCategories(staples).map((c) => ({
          key: c,
          label: c,
          active: category === c,
          onPress: () => setCategory(c),
        }))}
      />
      {low.length > 0 ? (
        <>
          <SectionHeader title="Running low" dot count={low.length} />
          {rows(low)}
        </>
      ) : null}
      <SectionHeader
        title={category === ALL_CATEGORIES ? 'All staples' : category}
        count={list.length}
      />
      {list.length > 0 ? (
        rows(rest)
      ) : (
        <EmptyState
          icon="pantry"
          title="Nothing here"
          body="Add a staple to start tracking it."
          actions={[
            { label: 'Add staple', variant: 'lime', onPress: () => setSheet({ kind: 'add' }) },
          ]}
        />
      )}
    </Screen>
  );
}

/** Level editor: big "N / 5 left", tappable bars, pack size, last updated, remove / refill. */
function LevelSheet({ staple, onClose }: { staple: Staple | undefined; onClose: () => void }) {
  const { setLevel, refill, remove } = usePantryStore((s) => s);
  // Keep showing the last staple while the sheet animates closed (after Remove it's gone).
  const [shown, setShown] = useState(staple);
  if (staple && staple !== shown) setShown(staple);
  const current = staple ?? shown;
  return (
    <Sheet
      open={!!staple}
      onClose={onClose}
      title={current?.name ?? ''}
      footer={
        current
          ? [
              <PrimaryButton
                key="remove"
                label="Remove"
                variant="danger"
                icon="trash"
                onPress={() => {
                  void remove(current.id);
                  onClose();
                  showToast(`Removed ${current.name}`);
                }}
              />,
              <PrimaryButton
                key="refill"
                label="Mark refilled"
                variant="lime"
                icon="check"
                onPress={() => {
                  void refill(current.id);
                  onClose();
                  showToast('Marked as refilled');
                }}
              />,
            ]
          : null
      }
    >
      {current ? (
        <View style={styles.sheetBody}>
          <View
            style={styles.level}
            accessible
            accessibilityLabel={`${Math.round(current.level)} of 5 left`}
          >
            <AppText variant="display" size={72} color="lime">
              {String(Math.round(current.level))}
            </AppText>
            <AppText variant="display" size={26} color="text2">
              / {FULL_LEVEL} left
            </AppText>
          </View>
          <LevelBars
            level={current.level}
            size={52}
            label={`Set ${current.name} level`}
            onChange={(level) => setLevel(current.id, level)}
          />
          <View style={styles.scale}>
            <AppText variant="caption">Empty</AppText>
            <AppText variant="caption">Full</AppText>
          </View>
          <ListRow label="Pack size" detail={current.unitHint} icon="pantry" />
          <ListRow label="Last updated" detail={timeAgo(current.updatedAt)} icon="clock" />
        </View>
      ) : null}
    </Sheet>
  );
}

/** Add a staple: search the catalog's suggestions not already in the pantry, tap to add. */
function AddStapleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catalog = useCatalog();
  const staples = usePantryStore((s) => s.staples);
  const add = usePantryStore((s) => s.add);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const options = (catalog.data?.stapleSuggestions ?? [])
    .filter((o) => !staples.some((s) => s.name === o.name))
    .filter((o) => !q || o.name.toLowerCase().includes(q));

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Add a staple">
      <View style={styles.sheetBody}>
        <SearchField inSheet value={query} onChangeText={setQuery} placeholder="Search staples" />
        <QueryState
          loading={catalog.isLoading}
          errorMessage={catalog.errorMessage}
          onRetry={catalog.refetch}
          placeholder="chips"
        >
          {options.length > 0 ? (
            <ChipRow
              wrap
              chips={options.map((o) => ({
                key: o.name,
                label: o.name,
                icon: 'plus',
                onPress: () => {
                  void add(o);
                  close();
                  showToast(`${o.name} added to your pantry`);
                },
              }))}
            />
          ) : (
            <AppText variant="caption">
              {q ? 'No staples match that search.' : 'Every suggestion is already in your pantry.'}
            </AppText>
          )}
        </QueryState>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[2] },
  sheetBody: { gap: spacing[3] },
  level: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
});
