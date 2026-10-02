import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { BottomNav, type NavTab } from '@/components/BottomNav';
import { DetectedChip } from '@/components/DetectedChip';
import { EmptyState } from '@/components/EmptyState';
import { FormSection } from '@/components/FormSection';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { IngredientRow } from '@/components/IngredientRow';
import { ListRow } from '@/components/ListRow';
import { LiveBadge } from '@/components/LiveBadge';
import { PantryItem } from '@/components/PantryItem';
import { PhotoHero, HeroFadeContinuation } from '@/components/PhotoHero';
import { PhotoStack } from '@/components/PhotoStack';
import { PhotoThumbStrip, type ThumbPhoto } from '@/components/PhotoThumbStrip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuantitySlider } from '@/components/QuantitySlider';
import { RangeSlider } from '@/components/RangeSlider';
import { RecipeCard } from '@/components/RecipeCard';
import { ScanOverlay } from '@/components/ScanOverlay';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { ShutterButton } from '@/components/ShutterButton';
import { StatTileRow } from '@/components/StatTileRow';
import { StepTimeline } from '@/components/StepTimeline';
import { Stepper } from '@/components/Stepper';
import { TabBar } from '@/components/TabBar';
import { TicketCard } from '@/components/TicketCard';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { TopBar } from '@/components/TopBar';
import {
  BROKEN_PHOTO,
  DeviceFrame,
  PHOTOS,
  PhotoBackdrop,
  Section,
  noop,
} from '@/screens/dev/galleryKit';
import { spacing } from '@/theme/tokens';

// Realistic literals from the mockup's data.js. Screens get these from stores / queries.
const BUTTER_CHICKEN = {
  id: 'butter-chicken',
  name: 'Butter Chicken Lite',
  timeMin: 35,
  image: PHOTOS.butterChicken,
  cuisine: 'Indian',
  effort: 3,
};
const PALAK_PANEER = {
  id: 'palak-paneer',
  name: 'Palak Paneer',
  timeMin: 30,
  image: PHOTOS.palakPaneer,
  cuisine: 'Indian',
  effort: 3,
};
const STEPS = [
  {
    text: 'Toss the chicken with yogurt, chilli, ginger-garlic paste and salt. Rest while you prep.',
    minutes: 10,
  },
  { text: 'Sear the chicken in half the butter until golden. Set aside.', minutes: 6 },
  { text: 'Cook onion, garlic and tomatoes down to a thick, jammy purée.', minutes: 10 },
  { text: 'Stir in garam masala, return the chicken, add cream and simmer.', minutes: 8 },
  { text: 'Finish with the rest of the butter. Serve with rice or roti.', minutes: 1 },
];
const STAPLES = [
  { id: 'turmeric', name: 'Turmeric', level: 4, unitHint: '~100 g jar' },
  { id: 'garam', name: 'Garam masala', level: 1, unitHint: '~100 g pack' },
  { id: 'oil', name: 'Sunflower oil', level: 3, unitHint: '1 L bottle' },
];
const DETECTED = [
  { name: 'Chicken breast', confidence: 'low' as const },
  { name: 'Eggs', confidence: 'high' as const },
  { name: 'Tomatoes', confidence: 'high' as const },
  { name: 'Paneer', confidence: 'low' as const },
  { name: 'Rice', confidence: 'med' as const },
];

// Demo-only unit switch for the chicken card (real conversions live in domain/, Sprint 04).
const CHICKEN_UNITS = {
  g: { min: 100, max: 1500, step: 50, estimate: 500, factor: 1 },
  kg: { min: 0.1, max: 1.5, step: 0.05, estimate: 0.5, factor: 1000 },
};

/** Sprint 03 composites with realistic props. */
export function CompositesGallery() {
  const [navTab, setNavTab] = useState<NavTab>('home');
  const [time, setTime] = useState(45);
  const [servings, setServings] = useState(2);
  const [household, setHousehold] = useState(3);
  const [autoInclude, setAutoInclude] = useState(true);
  const [included, setIncluded] = useState<Record<string, boolean>>({ oil: false });
  const [chicken, setChicken] = useState({ grams: 500, unit: 'g' as 'g' | 'kg', touched: false });
  const [paneer, setPaneer] = useState(250);
  const [eggs, setEggs] = useState(6);
  const [photos, setPhotos] = useState<ThumbPhoto[]>([
    { id: 'p1', uri: PHOTOS.fridgeLarge, label: 'Fridge' },
    { id: 'p2', uri: PHOTOS.pantryShelf, label: 'Pantry shelf', blurry: true },
    { id: 'p3', uri: PHOTOS.spiceRack, label: 'Spice rack' },
  ]);
  const [chipsKey, setChipsKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ingredients');

  const cu = CHICKEN_UNITS[chicken.unit];

  return (
    <>
      <Section title="Screen (footer variants)">
        <DeviceFrame height={300}>
          <Screen
            footer={<PrimaryButton label="Cook up ideas" variant="lime" iconRight="sparkle" />}
          >
            <FormSection title="Hunger" hint="Default footer: dark fade behind the CTA." />
            <FormSection divider title="Servings" right={<Stepper value={2} label="Servings" />} />
            <FormSection divider title="Cuisine" hint="Scroll: content passes under the fade." />
          </Screen>
        </DeviceFrame>
        <DeviceFrame height={220}>
          <Screen footerVariant="lime" footer={<PrimaryButton label="Start cooking" />}>
            <FormSection title="Lime footer" hint="Recipe detail: lime slab, rounded top." />
          </Screen>
        </DeviceFrame>
        <DeviceFrame height={220}>
          <Screen
            footerVariant="row"
            footer={[
              <PrimaryButton key="b" label="Back" variant="outline" icon="back" />,
              <PrimaryButton key="n" label="Next step" variant="lime" iconRight="chevronRight" />,
            ]}
          >
            <FormSection title="Row footer" hint="Cook mode: buttons side by side." />
          </Screen>
        </DeviceFrame>
        <DeviceFrame height={260}>
          <Screen withNav>
            <SectionHeader title="With nav" />
            <AppText variant="body">Bottom padding leaves room for the floating BottomNav.</AppText>
          </Screen>
          <BottomNav active={navTab} onNavigate={setNavTab} />
        </DeviceFrame>
      </Section>

      <Section title="TopBar">
        <TopBar
          left={<IconButton icon="back" label="Back" />}
          center={<LiveBadge label="Ready" />}
          right={<IconButton icon="more" label="More" />}
        />
        <TopBar left={<AppLogo size={50} />} right={<IconButton icon="user" label="Profile" />} />
      </Section>

      <Section title="SectionHeader">
        <SectionHeader title="Running low" dot count={2} actionLabel="See all" onAction={noop} />
        <SectionHeader title="Cook again" actionLabel="Saved" onAction={noop} />
        <SectionHeader title="Saved recipes" count={4} />
      </Section>

      <Section title="FormSection">
        <FormSection title="Time you have">
          <RangeSlider
            min={10}
            max={120}
            step={5}
            value={time}
            unit="min"
            marks={[15, 30, 60, 90]}
            label="Minutes available"
            onChange={setTime}
          />
        </FormSection>
        <FormSection
          divider
          title="Servings"
          hint="Recipes scale to this."
          right={
            <Stepper value={servings} min={1} max={8} label="Servings" onChange={setServings} />
          }
        />
      </Section>

      <Section title="InfoCard">
        <InfoCard
          title="Staples are remembered"
          body="Spices, oils and basics are counted in every scan."
          right={
            <Toggle bare on={autoInclude} label="Auto-include staples" onChange={setAutoInclude} />
          }
        />
        <InfoCard icon="chevronRight" title="Up next" body="Sear the chicken in half the butter." />
        <InfoCard
          icon="check"
          variant="lime"
          title="Last step"
          body="Plate up - we'll update your pantry after."
        />
        <InfoCard
          icon="pantry"
          title="Auto-include is off"
          body="Turn it on to count your remembered spices & basics."
          footer={<Toggle on={false} label="Auto-include pantry staples" onChange={noop} />}
        />
        <PhotoBackdrop>
          <View style={styles.fill}>
            <InfoCard
              variant="alert"
              icon="alert"
              title="Photo 2 looks blurry"
              body="Retake it for a better count."
              right={<PrimaryButton label="Retake" variant="light" size="xs" full={false} />}
            />
          </View>
          <View style={styles.fill}>
            <InfoCard variant="glass" icon="sparkle" title="Glass card" body="Over photos." />
          </View>
        </PhotoBackdrop>
      </Section>

      <Section title="ListRow">
        <ListRow icon="leaf" label="Diet" detail="Vegetarian" onPress={noop} />
        <ListRow icon="alert" label="Allergies" detail="Nuts, Shellfish, Gluten" onPress={noop} />
        <ListRow
          icon="user"
          label="Household"
          right={
            <Stepper
              value={household}
              min={1}
              max={8}
              label="Household size"
              onChange={setHousehold}
            />
          }
        />
        <ListRow icon="clock" label="Last updated" detail="2d ago" />
        <ListRow icon="trash" label="Reset demo data" danger onPress={noop} />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          title="No matches"
          body="Nothing fits 15 minutes with these filters."
          actions={[
            { label: 'Loosen filters', variant: 'lime', onPress: noop },
            { label: 'Add 30 min', variant: 'outline', onPress: noop },
          ]}
        />
      </Section>

      <Section title="TicketCard">
        <TicketCard
          top={<AppText variant="display" size={30} color="ink">{`Lime / white`}</AppText>}
          bottom={
            <AppText variant="caption" color="ink2">
              Notches + dashed seam
            </AppText>
          }
        />
        <TicketCard
          variant="dark"
          bottomVariant="light"
          top={
            <AppText variant="display" size={30}>
              Dark / light
            </AppText>
          }
          bottom={
            <AppText variant="caption" color="ink2">
              bottomVariant light
            </AppText>
          }
        />
        <TicketCard
          variant="light"
          compact
          onPress={noop}
          label="Top-only compact card"
          top={
            <AppText variant="display" size={24} color="ink">
              Top only · compact · pressable
            </AppText>
          }
        />
      </Section>

      <Section title="RecipeCard">
        <RecipeCard
          recipe={BUTTER_CHICKEN}
          match={{ pct: 91, have: 10, total: 11, missing: [{ name: 'Fresh cream' }] }}
          onPress={noop}
        />
        <RecipeCard
          recipe={PALAK_PANEER}
          variant="light"
          match={{ pct: 100, have: 9, total: 9, missing: [] }}
          onPress={noop}
        />
        <RecipeCard
          compact
          recipe={BUTTER_CHICKEN}
          match={{ pct: 91, have: 10, total: 11, missing: [] }}
          onPress={noop}
        />
        <RecipeCard compact stat="effort" variant="light" recipe={PALAK_PANEER} onPress={noop} />
      </Section>

      <Section title="PhotoHero + HeroFadeContinuation">
        <DeviceFrame height={620}>
          <Screen flush footerVariant="lime" footer={<PrimaryButton label="Start cooking" />}>
            <PhotoHero uri={PHOTOS.butterChicken} alt="Butter Chicken Lite" height={330}>
              <TopBar
                left={<IconButton icon="back" label="Back" variant="glass" />}
                right={<IconButton icon="heart" label="Save recipe" variant="glass" />}
              />
              <View style={styles.heroTitle}>
                <AppText variant="display" size={52} style={styles.heroTitleText}>
                  Butter Chicken Lite
                </AppText>
                <AppText variant="caption" color="text">
                  Indian · Moderate · Serves 2
                </AppText>
              </View>
            </PhotoHero>
            <HeroFadeContinuation>
              <StatTileRow
                tiles={[
                  { value: '35', caption: 'MIN', variant: 'lime' },
                  { value: '540', caption: 'KCAL', variant: 'white' },
                  { value: '38G', caption: 'PROTEIN', variant: 'soft' },
                ]}
              />
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
            </HeroFadeContinuation>
          </Screen>
        </DeviceFrame>
        <PhotoHero uri={BROKEN_PHOTO} alt="Offline photo" height={140} />
      </Section>

      <Section title="IngredientRow">
        <View>
          <IngredientRow
            name="Chicken breast"
            qty="400 G"
            status="have"
            thumb={PHOTOS.chicken}
            note="You have 500 g"
          />
          <IngredientRow
            name="Yogurt"
            qty="100 G"
            status="short"
            thumb={PHOTOS.yogurt}
            note="You have 50 g"
          />
          <IngredientRow name="Garam masala" qty="1 TSP" status="pantry" />
          <IngredientRow
            name="Fresh cream"
            qty="50 ML"
            status="missing"
            note="Swap: 2 tbsp yogurt + 1 tsp butter"
            last
          />
        </View>
      </Section>

      <Section title="StepTimeline">
        <StepTimeline steps={STEPS} active={1} />
      </Section>

      <Section title="PantryItem">
        <PantryItem item={STAPLES[0]!} updatedLabel="today" onPress={noop} />
        <PantryItem item={STAPLES[1]!} low updatedLabel="12d ago" onPress={noop} />
        {STAPLES.map((s) => (
          <PantryItem
            key={s.id}
            item={s}
            low={s.level <= 1}
            toggle={{
              on: included[s.id] ?? true,
              onChange: (on) => setIncluded((cur) => ({ ...cur, [s.id]: on })),
            }}
          />
        ))}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cards}
        >
          {STAPLES.map((s) => (
            <PantryItem key={s.id} variant="card" item={s} low={s.level <= 1} onPress={noop} />
          ))}
        </ScrollView>
      </Section>

      <Section title="QuantitySlider">
        <QuantitySlider
          name="Chicken breast"
          thumb={PHOTOS.chicken}
          confidence="low"
          touched={chicken.touched}
          value={chicken.grams / cu.factor}
          min={cu.min}
          max={cu.max}
          step={cu.step}
          unit={chicken.unit}
          units={['g', 'kg']}
          estimate={cu.estimate}
          onChange={(v) => setChicken((c) => ({ ...c, grams: v * cu.factor, touched: true }))}
          onUnitChange={(u) => setChicken((c) => ({ ...c, unit: u as 'g' | 'kg' }))}
          onConfirm={() => setChicken((c) => ({ ...c, touched: true }))}
          onRemove={() => showToast('Chicken breast removed')}
        />
        <QuantitySlider
          name="Paneer"
          thumb={PHOTOS.paneer}
          confidence="low"
          touched
          value={paneer}
          min={0}
          max={1000}
          step={25}
          unit="g"
          estimate={200}
          onChange={setPaneer}
        />
        <QuantitySlider
          name="Eggs"
          confidence="high"
          touched={false}
          value={eggs}
          min={0}
          max={30}
          step={1}
          unit="pcs"
          estimate={6}
          onChange={setEggs}
        />
      </Section>

      <Section title="PhotoThumbStrip">
        <PhotoBackdrop>
          <PhotoThumbStrip
            photos={photos}
            onRemove={(id) => setPhotos((cur) => cur.filter((p) => p.id !== id))}
            onAdd={() =>
              setPhotos((cur) => [
                ...cur,
                { id: `p${Date.now()}`, uri: PHOTOS.vegetables, label: 'Vegetables' },
              ])
            }
          />
        </PhotoBackdrop>
      </Section>

      <Section title="PhotoStack (scanning)">
        <PhotoStack
          scanning
          photos={[
            { id: 'a', uri: PHOTOS.fridgeLarge, label: 'Fridge' },
            { id: 'b', uri: PHOTOS.pantryShelf, label: 'Pantry shelf' },
            { id: 'c', uri: PHOTOS.spiceRack, label: 'Spice rack' },
          ]}
        />
      </Section>

      <Section title="ScanOverlay + ShutterButton">
        <DeviceFrame height={440}>
          <PhotoHero fill fade={false} uri={PHOTOS.fridgeLarge} alt="Camera preview">
            <ScanOverlay />
          </PhotoHero>
          <View style={styles.shutterRow}>
            <ShutterButton onPress={() => showToast('Photo 4 added')} />
            <ShutterButton disabled />
          </View>
        </DeviceFrame>
      </Section>

      <Section title="DetectedChip">
        <View style={styles.chips} key={chipsKey}>
          {DETECTED.map((d, i) => (
            <DetectedChip key={d.name} {...d} animate connector={i > 0} />
          ))}
        </View>
        <PrimaryButton
          label="Replay pop-in"
          variant="outline"
          size="xs"
          full={false}
          onPress={() => setChipsKey((k) => k + 1)}
        />
      </Section>

      <Section title="SearchField">
        <SearchField value={search} onChangeText={setSearch} placeholder="Search ingredients" />
      </Section>

      <Section title="Sheet + Toast">
        <View style={styles.row}>
          <PrimaryButton
            label="Open sheet"
            variant="lime"
            size="sm"
            full={false}
            onPress={() => setSheetOpen(true)}
          />
          <PrimaryButton
            label="Show toast"
            variant="outline"
            size="sm"
            full={false}
            onPress={() => showToast('Pantry updated - 3 staples running low')}
          />
        </View>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Add missed item"
          footer={[
            <PrimaryButton
              key="c"
              label="Cancel"
              variant="outline"
              onPress={() => setSheetOpen(false)}
            />,
            <PrimaryButton
              key="a"
              label="Add"
              variant="lime"
              onPress={() => {
                setSheetOpen(false);
                showToast('Fresh cream added');
              }}
            />,
          ]}
        >
          <SearchField
            inSheet
            value={search}
            onChangeText={setSearch}
            placeholder="Search ingredients"
          />
          <ListRow label="Fresh cream" detail="ml" onPress={noop} />
          <ListRow label="Butter" detail="tbsp" onPress={noop} />
          <ListRow label="Coriander" detail="bunch" onPress={noop} />
        </Sheet>
      </Section>

      <Section title="BottomNav">
        <BottomNav floating={false} active={navTab} onNavigate={setNavTab} />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flexBasis: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  cards: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroTitle: { marginTop: 'auto', gap: spacing[2] },
  heroTitleText: { lineHeight: 45 },
  shutterRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
  },
});
