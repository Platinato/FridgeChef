/**
 * Static app content and small helpers shared by the screens (copy and order ported from
 * fridgechef-mockup/js/data.js). Backend-controlled lists (moods, diets, allergies, staple
 * suggestions) come from `useCatalog()`, not from here.
 */
import type { IconName } from '@/components/Icon';
import type {
  CatalogOption,
  DietPref,
  EffortPref,
  FilterId,
  Hunger,
  SortId,
  Staple,
  UnitSystem,
} from '@/domain/types';
import { iconNames } from '@/theme/icons';

/** Default effort / Mood effort options. `level` is only shown on the Mood screen (Sprint 08). */
export const EFFORT_OPTIONS: { value: EffortPref; label: string; level: number; desc: string }[] = [
  {
    value: 'minimal',
    label: 'Minimal',
    level: 1,
    desc: 'One pan, few steps, barely any chopping.',
  },
  { value: 'moderate', label: 'Moderate', level: 3, desc: 'Some chopping and a bit of simmering.' },
  {
    value: 'chef',
    label: 'Chef mode',
    level: 5,
    desc: 'Bring it on - multi-step cooking is fine.',
  },
];

export const UNIT_OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

export const HOUSEHOLD_MIN = 1;
export const HOUSEHOLD_MAX = 8;

/** The mockup's Pantry category chips, in its order. */
export const PANTRY_CATEGORIES = [
  'Spices',
  'Oils & Fats',
  'Grains & Flours',
  'Sauces',
  'Baking',
  'Dairy basics',
] as const;
export const ALL_CATEGORIES = 'All';

/** "All", the mockup's categories, then any other category a staple has (in first-seen order). */
export function pantryCategories(staples: Pick<Staple, 'category'>[]): string[] {
  const known: string[] = [...PANTRY_CATEGORIES];
  const extra = [...new Set(staples.map((s) => s.category))].filter((c) => !known.includes(c));
  return [ALL_CATEGORIES, ...known, ...extra];
}

const DIET_PREFS: readonly string[] = ['none', 'veg', 'vegan', 'egg', 'keto', 'protein', 'jain'];

/** Catalog diets the app understands (an unknown id would fail the suggest request's schema). */
export const dietOptions = (diets: CatalogOption[] = []): { id: DietPref; label: string }[] =>
  diets
    .filter((d) => DIET_PREFS.includes(d.id))
    .map((d) => ({ id: d.id as DietPref, label: d.label }));

const ICONS = new Set<string>(iconNames);

/** A catalog icon string as an `IconName`, or `fallback` when the app doesn't have that icon. */
export const iconOr = (name: string | undefined, fallback: IconName): IconName =>
  name && ICONS.has(name) ? (name as IconName) : fallback;

/** Onboarding slides. Images are remote (offline → FallbackImage initials); Sprint 09 may bundle them. */
export const ONBOARDING_SLIDES = [
  {
    kicker: 'Step 01',
    title: 'Snap',
    body: 'Take a few photos of your fridge, pantry and shelves - or pick them straight from your gallery.',
    image:
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=70',
  },
  {
    kicker: 'Step 02',
    title: 'Confirm',
    body: 'Photos can fool anyone. Slide to the real amount so every recipe fits what you actually have.',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=70',
  },
  {
    kicker: 'Step 03',
    title: 'Cook',
    body: 'Tell us your mood, time and energy. Get doable recipes - with your spices already remembered.',
    image:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=70',
  },
] as const;

/** Mood → Hunger (mockup `data.hunger`). */
export const HUNGER_OPTIONS: { value: Hunger; label: string }[] = [
  { value: 'snack', label: 'Snack' },
  { value: 'meal', label: 'Meal' },
  { value: 'starving', label: 'Starving' },
];

/** Mood → spice level 1-5 hint (mockup `data.spiceLabels`). */
export const SPICE_LABELS = ['Mild', 'Gentle', 'Medium', 'Hot', 'Fire'] as const;
export const spiceLabel = (spice: number): string =>
  SPICE_LABELS[Math.min(SPICE_LABELS.length, Math.max(1, Math.round(spice))) - 1]!;

/** Mood → time slider. */
export const TIME_MIN = 10;
export const TIME_STEP = 5;
export const TIME_MARKS = [15, 30, 60, 90];

/** Suggestions filter chips (mockup `data.filters`). */
export const FILTER_OPTIONS: { value: FilterId; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'everything', label: 'Uses everything' },
  { value: 'quick', label: '≤ 20 min' },
  { value: 'onepan', label: 'One-pan' },
  { value: 'protein', label: 'High-protein' },
];

/** Suggestions sort sheet (mockup `data.sorts`). */
export const SORT_OPTIONS: { value: SortId; label: string }[] = [
  { value: 'best', label: 'Best match' },
  { value: 'quick', label: 'Quickest' },
  { value: 'effort', label: 'Least effort' },
  { value: 'protein', label: 'Highest protein' },
];

/** Recipe detail → Nutrition bars: the "typical meal" maxima (mockup RecipeDetail). */
export const NUTRITION_MAX = { protein: 60, carbs: 90, fat: 45 } as const;
