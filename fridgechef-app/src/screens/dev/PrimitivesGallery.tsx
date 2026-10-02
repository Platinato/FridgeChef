import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { ChipRow } from '@/components/ChipRow';
import { CounterPill } from '@/components/CounterPill';
import { Disc } from '@/components/Disc';
import { HeroTitle } from '@/components/HeroTitle';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LevelBars } from '@/components/LevelBars';
import { LiveBadge } from '@/components/LiveBadge';
import { PaginationDots } from '@/components/PaginationDots';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTileRow } from '@/components/StatTileRow';
import { Stepper } from '@/components/Stepper';
import { TabBar } from '@/components/TabBar';
import { Toggle } from '@/components/Toggle';
import { iconNames } from '@/theme/icons';
import { colors, radii, spacing, type } from '@/theme/tokens';
import { BROKEN_PHOTO, PHOTOS, PhotoBackdrop, Section, noop } from '@/screens/dev/galleryKit';

const SWATCHES = [
  'bg',
  'surface1',
  'surface2',
  'surface3',
  'border',
  'lime',
  'limeSoft',
  'limeDeep',
  'lightCard',
  'text',
  'text2',
  'text3',
  'ink2',
  'alert',
  'alertText',
] as const;

/** Sprint 02 primitives in every variant and state. */
export function PrimitivesGallery() {
  const [mood, setMood] = useState('comfort');
  const [cuisines, setCuisines] = useState<string[]>(['Indian']);
  const [spice, setSpice] = useState(2);
  const [stock, setStock] = useState(3);
  const [autoInclude, setAutoInclude] = useState(true);
  const [bareOn, setBareOn] = useState(false);
  const [servings, setServings] = useState(2);
  const [qty, setQty] = useState(1.5);
  const [effort, setEffort] = useState('easy');
  const [hunger, setHunger] = useState('meal');
  const [unit, setUnit] = useState('g');
  const [units, setUnits] = useState('metric');
  const [tab, setTab] = useState('ingredients');
  const [page, setPage] = useState(0);
  const [saved, setSaved] = useState(false);

  const toggleCuisine = (c: string) =>
    setCuisines((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <>
      <Section title="Colour tokens">
        <View style={styles.wrap}>
          {SWATCHES.map((name) => (
            <View key={name} style={styles.swatch}>
              <View style={[styles.swatchChip, { backgroundColor: colors[name] }]} />
              <AppText variant="caption" size={11}>
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="AppText">
        <AppText variant="display" size={type.displayXL}>
          Display XL
        </AppText>
        <AppText variant="display" size={type.displayL}>
          Display L
        </AppText>
        <AppText variant="display" size={type.displayM} color="lime">
          Display M lime
        </AppText>
        <AppText variant="display" size={type.displayS}>
          Display S
        </AppText>
        <AppText variant="bodyL">Body L - Inter 17 / 1.45, white</AppText>
        <AppText variant="bodyL" weight={600}>
          Body L semibold
        </AppText>
        <AppText variant="body">Body - Inter 15 / 1.5, grey</AppText>
        <AppText variant="caption">Caption - Inter 13 / 1.45, grey</AppText>
        <AppText variant="micro">Micro - 11, uppercase, tracked</AppText>
        <View style={styles.inkCard}>
          <AppText variant="bodyL" color="ink" weight={600}>
            Ink on light card
          </AppText>
          <AppText variant="caption" color="ink2">
            ink2 caption on light card
          </AppText>
        </View>
      </Section>

      <Section title={`Icon (${iconNames.length})`}>
        <View style={styles.wrap}>
          {iconNames.map((name) => (
            <View key={name} style={styles.iconCell}>
              <Icon name={name} size={24} />
              <AppText variant="caption" size={10} numberOfLines={1}>
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="AppLogo">
        <View style={styles.row}>
          <AppLogo size={32} />
          <AppLogo />
          <AppLogo size={72} />
        </View>
      </Section>

      <Section title="IconButton">
        <View style={styles.row}>
          <IconButton icon="search" label="Search" onPress={noop} />
          <IconButton icon="bell" label="Notifications" badge onPress={noop} />
          <IconButton icon="plus" label="Add staple" variant="lime" onPress={noop} />
          <IconButton icon="sort" label="Sort" variant="ghost" onPress={noop} />
          <IconButton icon="more" label="More" variant="ink" onPress={noop} />
          <IconButton icon="trash" label="Remove" disabled onPress={noop} />
        </View>
        <PhotoBackdrop>
          <IconButton icon="back" label="Back" variant="glass" onPress={noop} />
          <IconButton
            icon={saved ? 'heartFill' : 'heart'}
            label={saved ? 'Remove from saved' : 'Save recipe'}
            variant={saved ? 'lime' : 'glass'}
            onPress={() => setSaved((s) => !s)}
          />
          <IconButton icon="flip" label="Switch camera" variant="glass" size={52} onPress={noop} />
          <IconButton image={PHOTOS.fridge} label="Upload from gallery" size={52} onPress={noop} />
          <IconButton image={BROKEN_PHOTO} label="Fresh basil" size={52} onPress={noop} />
          <IconButton icon="close" label="Close" size={40} onPress={noop} />
        </PhotoBackdrop>
      </Section>

      <Section title="Chip + ChipRow">
        <View style={styles.row}>
          <Chip label="Inactive" onPress={noop} />
          <Chip label="Active" active onPress={noop} />
          <Chip label="Small" size="sm" onPress={noop} />
        </View>
        <ChipRow
          chips={(
            [
              { key: 'comfort', label: 'Comfort', icon: 'bowl' },
              { key: 'light', label: 'Light', icon: 'leaf' },
              { key: 'adventurous', label: 'Adventurous', icon: 'compass' },
              { key: 'lazy', label: 'Lazy', icon: 'sofa' },
              { key: 'protein', label: 'Protein', icon: 'dumbbell' },
              { key: 'party', label: 'Party', icon: 'party' },
            ] as const
          ).map((c) => ({ ...c, active: mood === c.key, onPress: () => setMood(c.key) }))}
        />
        <ChipRow
          wrap
          chips={['Any', 'Indian', 'Italian', 'Mexican', 'Thai', 'Chinese', 'Middle Eastern'].map(
            (c) => ({
              key: c,
              label: c,
              size: 'sm' as const,
              active: cuisines.includes(c),
              onPress: () => toggleCuisine(c),
            }),
          )}
        />
      </Section>

      <Section title="Badge + LiveBadge">
        <View style={styles.row}>
          <Badge label="Lime" />
          <Badge label="Dark" variant="dark" />
          <Badge label="Ink" variant="ink" />
          <Badge label="Outline" variant="outline" />
          <Badge label="Please check" dot="red" variant="alert" />
        </View>
        <View style={styles.row}>
          <Badge label="Have" icon="check" size="sm" />
          <Badge label="Short" dot="red" variant="alert" size="sm" />
          <Badge label="Pantry" variant="dark" size="sm" />
          <Badge label="Sure" variant="dark" size="sm" />
        </View>
        <PhotoBackdrop>
          <Badge label="Open the door wide · Good light" variant="glass" size="sm" />
          <Badge label="Quantities confirmed" icon="check" variant="dark" />
        </PhotoBackdrop>
        <View style={styles.row}>
          <LiveBadge label="Ready" />
          <LiveBadge label="Scanning" />
          <LiveBadge label="3 matches" size="sm" />
        </View>
        <LiveBadge
          label="04:59"
          icon="timer"
          size="lg"
          onPress={noop}
          accessibilityLabel="Start the timer"
        />
      </Section>

      <Section title="CounterPill">
        <View style={styles.row}>
          <CounterPill icon="basket" value="12 items" />
          <CounterPill icon="pantry" value="25 staples" />
        </View>
      </Section>

      <Section title="PrimaryButton">
        <PrimaryButton label="Start cooking" onPress={noop} />
        <PrimaryButton label="Cook up ideas" variant="lime" iconRight="sparkle" onPress={noop} />
        <PrimaryButton label="Add missed item" variant="outline" icon="plus" onPress={noop} />
        <PrimaryButton label="Remove" variant="danger" icon="trash" onPress={noop} />
        <PrimaryButton label="Analyze 3 photos" variant="light" onPress={noop} />
        <PrimaryButton label="Disabled" variant="lime" disabled onPress={noop} />
        <View style={styles.row}>
          <PrimaryButton
            label="Looks right"
            icon="check"
            variant="lime"
            size="sm"
            full={false}
            onPress={noop}
          />
          <PrimaryButton label="Scan now" size="sm" full={false} onPress={noop} />
          <PrimaryButton label="Skip" variant="ghost" size="sm" full={false} onPress={noop} />
        </View>
        <PhotoBackdrop>
          <PrimaryButton label="Retake" variant="light" size="xs" full={false} onPress={noop} />
          <PrimaryButton label="Skip" variant="glass" size="xs" full={false} onPress={noop} />
        </PhotoBackdrop>
      </Section>

      <Section title="Disc">
        <View style={[styles.row, styles.discRow]}>
          <Disc label="35'" />
          <Disc
            icon="camera"
            size={64}
            variant="lime"
            onPress={noop}
            accessibilityLabel="Scan now"
          />
          <Disc icon="check" size={40} variant="dark" />
          <Disc icon="check" size={28} variant="lime" />
        </View>
      </Section>

      <Section title="LevelBars">
        <View style={styles.row}>
          <LevelBars level={3} />
          <LevelBars level={1} color="white" />
          <View style={styles.inkChip}>
            <LevelBars level={4} color="ink" size={8} />
          </View>
        </View>
        <LevelBars
          level={spice}
          size={30}
          onChange={setSpice}
          label={`Spice level ${spice} of 5`}
        />
        <LevelBars
          level={stock}
          size={52}
          onChange={setStock}
          label={`Stock level ${stock} of 5`}
        />
      </Section>

      <Section title="StatTile + StatTileRow">
        <StatTileRow
          tiles={[
            { value: '35', caption: 'MIN', variant: 'lime' },
            { value: '540', caption: 'KCAL', variant: 'white' },
            { value: '32G', caption: 'PROTEIN', variant: 'soft' },
          ]}
        />
      </Section>

      <Section title="ProgressBar">
        <ProgressBar value={2} max={5} />
        <ProgressBar value={3} max={5} label="Step 3 of 5" caption="60%" />
        <ProgressBar value={32} max={60} label="Protein" caption="32 g" variant="soft" />
        <ProgressBar value={18} max={60} label="Fat" caption="18 g" variant="white" />
      </Section>

      <Section title="Toggle">
        <Toggle
          on={autoInclude}
          label="Auto-include staples"
          sub="Add pantry staples to every scan"
          onChange={setAutoInclude}
        />
        <View style={styles.row}>
          <Toggle bare on={bareOn} label="Include salt" onChange={setBareOn} />
          <Toggle bare on label="Disabled on" disabled />
        </View>
      </Section>

      <Section title="Stepper">
        <View style={styles.row}>
          <Stepper value={servings} min={1} max={8} onChange={setServings} label="Servings" />
          <Stepper
            value={qty}
            min={0}
            max={3}
            step={0.25}
            unit="kg"
            onChange={setQty}
            label="Onions"
          />
          <Stepper
            value={servings}
            min={1}
            max={8}
            hideValue
            onChange={setServings}
            label="Servings"
          />
        </View>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          label="Hunger"
          value={hunger}
          onChange={setHunger}
          options={[
            { value: 'snack', label: 'Snack' },
            { value: 'meal', label: 'Meal' },
            { value: 'starving', label: 'Starving' },
          ]}
        />
        <SegmentedControl
          label="Effort"
          stacked
          value={effort}
          onChange={setEffort}
          options={[
            { value: 'easy', label: 'Minimal', level: 1 },
            { value: 'medium', label: 'Moderate', level: 3 },
            { value: 'pro', label: 'Chef mode', level: 5 },
          ]}
        />
        <SegmentedControl
          label="Default effort"
          value={effort}
          onChange={setEffort}
          options={[
            { value: 'easy', label: 'Minimal' },
            { value: 'medium', label: 'Moderate' },
            { value: 'pro', label: 'Chef mode' },
          ]}
        />
        <SegmentedControl
          label="Units"
          value={units}
          onChange={setUnits}
          options={[
            { value: 'metric', label: 'Metric' },
            { value: 'imperial', label: 'Imperial' },
          ]}
        />
        <SegmentedControl
          label="Unit"
          size="sm"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'g', label: 'g' },
            { value: 'kg', label: 'kg' },
            { value: 'pcs', label: 'pcs' },
          ]}
        />
      </Section>

      <Section title="TabBar">
        <TabBar
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'ingredients', label: 'Ingredients' },
            { id: 'steps', label: 'Steps' },
            { id: 'nutrition', label: 'Nutrition' },
            { id: 'swaps', label: 'Swaps' },
          ]}
        />
      </Section>

      <Section title="PaginationDots">
        <View style={styles.row}>
          <PaginationDots count={4} active={page} />
          <PrimaryButton
            label="Next"
            size="xs"
            variant="outline"
            full={false}
            onPress={() => setPage((p) => (p + 1) % 4)}
          />
        </View>
      </Section>

      <Section title="HeroTitle">
        <HeroTitle kicker="Explore" title="Recipes" />
        <HeroTitle
          kicker="My"
          title="Pantry"
          right={<CounterPill icon="pantry" value="25 staples" />}
        />
        <HeroTitle kicker="Confirm" title="Quantities" size={80} />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
  discRow: { gap: spacing[6], paddingVertical: spacing[2], paddingLeft: spacing[2] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  swatch: { width: 64, gap: spacing[1] },
  swatchChip: {
    height: 40,
    borderRadius: radii.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCell: {
    width: 64,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radii.s,
    backgroundColor: colors.surface1,
  },
  inkCard: {
    padding: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.lightCard,
    gap: spacing[1],
  },
  inkChip: { padding: spacing[2], borderRadius: radii.s, backgroundColor: colors.lime },
});
