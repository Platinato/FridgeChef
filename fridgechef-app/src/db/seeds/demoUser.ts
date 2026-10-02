/**
 * The demo starting state the mockup ships with (`data.js` → `seedState()`), as typed domain data.
 * Applied to `fridgechef.db` on first launch in mock mode (see `db/bootstrap.ts`).
 * Relative times are day offsets, resolved against "now" when the seed is applied.
 * Copy follows the content rules in CLAUDE.md (enforced by content-rules.test.ts).
 */
import { daysAgo } from '@/domain/format';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import type { Preferences, Profile, Recipe, Staple } from '@/domain/types';

export type DemoStaple = Omit<Staple, 'updatedAt'> & { updatedDaysAgo: number };

export type DemoUserSeed = {
  onboarded: boolean;
  profile: Profile;
  preferences: Preferences;
  staples: DemoStaple[];
  autoInclude: boolean;
  excluded: Record<string, boolean>;
  /** Newest first. */
  saved: { recipeId: string; savedDaysAgo: number }[];
  /** Newest first. */
  cooked: { recipeId: string; cookedDaysAgo: number; servings: number }[];
  lastScan: { daysAgo: number; items: number };
  /** Snapshots for every saved and cooked recipe. */
  recipes: Recipe[];
};

/** Pantry staples: level is 0-5 bars; perLevel = recipe units that use up one bar. */
export const DEMO_STAPLES: DemoStaple[] = [
  {
    id: 'turmeric',
    name: 'Turmeric',
    category: 'Spices',
    unitHint: '~100 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 1,
    updatedDaysAgo: 14,
  },
  {
    id: 'red_chilli',
    name: 'Red chilli powder',
    category: 'Spices',
    unitHint: '~100 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 1.75,
    updatedDaysAgo: 9,
  },
  {
    id: 'garam_masala',
    name: 'Garam masala',
    category: 'Spices',
    unitHint: '~50 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 1.75,
    updatedDaysAgo: 12,
  },
  {
    id: 'cumin',
    name: 'Cumin seeds',
    category: 'Spices',
    unitHint: '~100 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 3.5,
    updatedDaysAgo: 6,
  },
  {
    id: 'coriander',
    name: 'Coriander powder',
    category: 'Spices',
    unitHint: '~100 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 4,
    updatedDaysAgo: 20,
  },
  {
    id: 'mustard_seeds',
    name: 'Mustard seeds',
    category: 'Spices',
    unitHint: '~100 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 3,
    updatedDaysAgo: 30,
  },
  {
    id: 'black_pepper',
    name: 'Black pepper',
    category: 'Spices',
    unitHint: '~50 g grinder',
    unit: 'tsp',
    perLevel: 4,
    level: 2.5,
    updatedDaysAgo: 4,
  },
  {
    id: 'salt',
    name: 'Salt',
    category: 'Spices',
    unitHint: '1 kg pack',
    unit: 'tsp',
    perLevel: 20,
    level: 1,
    updatedDaysAgo: 21,
  },
  {
    id: 'oregano',
    name: 'Oregano',
    category: 'Spices',
    unitHint: '~20 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 4,
    updatedDaysAgo: 40,
  },
  {
    id: 'chilli_flakes',
    name: 'Chilli flakes',
    category: 'Spices',
    unitHint: '~40 g jar',
    unit: 'tsp',
    perLevel: 4,
    level: 3,
    updatedDaysAgo: 15,
  },
  {
    id: 'olive_oil',
    name: 'Olive oil',
    category: 'Oils & Fats',
    unitHint: '1 L bottle',
    unit: 'tbsp',
    perLevel: 8,
    level: 1.5,
    updatedDaysAgo: 3,
  },
  {
    id: 'mustard_oil',
    name: 'Mustard oil',
    category: 'Oils & Fats',
    unitHint: '1 L bottle',
    unit: 'tbsp',
    perLevel: 8,
    level: 4,
    updatedDaysAgo: 10,
  },
  {
    id: 'ghee',
    name: 'Ghee',
    category: 'Dairy basics',
    unitHint: '500 ml jar',
    unit: 'tbsp',
    perLevel: 6,
    level: 3,
    updatedDaysAgo: 7,
  },
  {
    id: 'butter',
    name: 'Butter',
    category: 'Dairy basics',
    unitHint: '500 g block',
    unit: 'tbsp',
    perLevel: 4,
    level: 2.5,
    updatedDaysAgo: 2,
  },
  {
    id: 'soy_sauce',
    name: 'Soy sauce',
    category: 'Sauces',
    unitHint: '200 ml bottle',
    unit: 'tbsp',
    perLevel: 6,
    level: 3.5,
    updatedDaysAgo: 18,
  },
  {
    id: 'vinegar',
    name: 'Vinegar',
    category: 'Sauces',
    unitHint: '500 ml bottle',
    unit: 'tbsp',
    perLevel: 8,
    level: 4,
    updatedDaysAgo: 45,
  },
  {
    id: 'ketchup',
    name: 'Tomato ketchup',
    category: 'Sauces',
    unitHint: '500 g bottle',
    unit: 'tbsp',
    perLevel: 6,
    level: 2,
    updatedDaysAgo: 5,
  },
  {
    id: 'gg_paste',
    name: 'Ginger-garlic paste',
    category: 'Sauces',
    unitHint: '200 g jar',
    unit: 'tsp',
    perLevel: 8,
    level: 3,
    updatedDaysAgo: 8,
  },
  {
    id: 'basmati',
    name: 'Basmati rice',
    category: 'Grains & Flours',
    unitHint: '5 kg bag',
    unit: 'cup',
    perLevel: 2,
    level: 4,
    updatedDaysAgo: 25,
  },
  {
    id: 'atta',
    name: 'Atta',
    category: 'Grains & Flours',
    unitHint: '5 kg bag',
    unit: 'cup',
    perLevel: 3,
    level: 4.5,
    updatedDaysAgo: 11,
  },
  {
    id: 'besan',
    name: 'Besan',
    category: 'Grains & Flours',
    unitHint: '1 kg pack',
    unit: 'cup',
    perLevel: 1.5,
    level: 2.5,
    updatedDaysAgo: 16,
  },
  {
    id: 'maida',
    name: 'Maida',
    category: 'Grains & Flours',
    unitHint: '1 kg pack',
    unit: 'cup',
    perLevel: 2,
    level: 3,
    updatedDaysAgo: 33,
  },
  {
    id: 'sugar',
    name: 'Sugar',
    category: 'Baking',
    unitHint: '1 kg pack',
    unit: 'tsp',
    perLevel: 30,
    level: 3.5,
    updatedDaysAgo: 9,
  },
  {
    id: 'baking_powder',
    name: 'Baking powder',
    category: 'Baking',
    unitHint: '100 g tin',
    unit: 'tsp',
    perLevel: 5,
    level: 4,
    updatedDaysAgo: 60,
  },
  {
    id: 'honey',
    name: 'Honey',
    category: 'Baking',
    unitHint: '250 g jar',
    unit: 'tbsp',
    perLevel: 6,
    level: 2,
    updatedDaysAgo: 13,
  },
];

export const resolveStaples = (staples: DemoStaple[], now: number): Staple[] =>
  staples.map(({ updatedDaysAgo, ...s }) => ({ ...s, updatedAt: daysAgo(updatedDaysAgo, now) }));

/** Recipe snapshots for the demo's saved (palak-paneer, shakshuka) and cooked (egg-fried-rice, paneer-bhurji) recipes. */
const DEMO_RECIPES: Recipe[] = [
  {
    id: 'palak-paneer',
    name: 'Palak Paneer',
    subtitle: 'Silky spinach, soft paneer cubes',
    cuisine: 'Indian',
    diet: 'veg',
    timeMin: 30,
    effort: 3,
    spice: 2,
    servings: 2,
    nutrition: {
      kcal: 420,
      protein: 22,
      carbs: 14,
      fat: 30,
    },
    moods: ['comfort', 'light'],
    equipment: ['stove', 'blender'],
    onePan: false,
    image:
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'spinach',
        name: 'Spinach',
        qty: 1,
        unit: 'bunch',
      },
      {
        id: 'paneer',
        name: 'Paneer',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 4,
        unit: 'cloves',
      },
      {
        id: 'ghee',
        name: 'Ghee',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'garam_masala',
        name: 'Garam masala',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Blanch the spinach for 2 minutes, then blend smooth with garlic.',
        minutes: 6,
      },
      {
        text: 'Crackle cumin in ghee, add onion and tomato and cook soft.',
        minutes: 8,
      },
      {
        text: 'Pour in the spinach purée with garam masala and salt. Simmer.',
        minutes: 6,
      },
      {
        text: 'Fold in paneer cubes and warm through.',
        minutes: 4,
      },
    ],
    swaps: [
      {
        missing: 'Paneer',
        use: 'Firm tofu or boiled potato cubes.',
      },
      {
        missing: 'Blender',
        use: 'Chop the spinach very fine - rustic but great.',
      },
    ],
  },
  {
    id: 'egg-fried-rice',
    name: 'Egg Fried Rice',
    subtitle: 'Leftover rice, 15 minutes, one pan',
    cuisine: 'Chinese',
    diet: 'egg',
    timeMin: 15,
    effort: 1,
    spice: 1,
    servings: 2,
    nutrition: {
      kcal: 480,
      protein: 18,
      carbs: 62,
      fat: 16,
    },
    moods: ['lazy', 'comfort'],
    equipment: ['stove'],
    onePan: true,
    image:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'rice',
        name: 'Rice',
        qty: 300,
        unit: 'g',
      },
      {
        id: 'eggs',
        name: 'Eggs',
        qty: 3,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 3,
        unit: 'cloves',
      },
      {
        id: 'soy_sauce',
        name: 'Soy sauce',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'black_pepper',
        name: 'Black pepper',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.5,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Scramble the eggs in hot oil, then push them to the side.',
        minutes: 3,
      },
      {
        text: 'Stir-fry garlic, onion and pepper on high heat.',
        minutes: 4,
      },
      {
        text: 'Add the rice, soy sauce and pepper. Toss until every grain is hot.',
        minutes: 5,
      },
    ],
    swaps: [
      {
        missing: 'Soy sauce',
        use: 'A pinch of salt + a few drops of vinegar.',
      },
    ],
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    subtitle: 'Eggs poached in spiced tomato sauce',
    cuisine: 'Middle Eastern',
    diet: 'egg',
    timeMin: 25,
    effort: 2,
    spice: 3,
    servings: 2,
    nutrition: {
      kcal: 390,
      protein: 20,
      carbs: 18,
      fat: 26,
    },
    moods: ['comfort', 'adventurous', 'date'],
    equipment: ['stove'],
    onePan: true,
    image:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'eggs',
        name: 'Eggs',
        qty: 4,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 4,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 3,
        unit: 'cloves',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'chilli_flakes',
        name: 'Chilli flakes',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'bread',
        name: 'Bread',
        qty: 4,
        unit: 'slices',
      },
    ],
    steps: [
      {
        text: 'Soften onion, pepper and garlic in olive oil with cumin and chilli.',
        minutes: 6,
      },
      {
        text: 'Add chopped tomatoes and simmer into a thick sauce.',
        minutes: 10,
      },
      {
        text: 'Make four wells, crack in the eggs, cover and cook until just set.',
        minutes: 6,
      },
      {
        text: 'Serve straight from the pan with bread for dipping.',
        minutes: 1,
      },
    ],
    swaps: [
      {
        missing: 'Bread',
        use: 'Toast leftover rotis or serve over rice.',
      },
    ],
  },
  {
    id: 'paneer-bhurji',
    name: 'Paneer Bhurji',
    subtitle: 'Scrambled paneer, ready in 15',
    cuisine: 'Indian',
    diet: 'veg',
    timeMin: 15,
    effort: 1,
    spice: 3,
    servings: 2,
    nutrition: {
      kcal: 380,
      protein: 24,
      carbs: 12,
      fat: 26,
    },
    moods: ['lazy', 'workout'],
    equipment: ['stove'],
    onePan: true,
    image:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'paneer',
        name: 'Paneer',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 2,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'turmeric',
        name: 'Turmeric',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'red_chilli',
        name: 'Red chilli powder',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'butter',
        name: 'Butter',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.5,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Crackle cumin in butter, then soften onion and pepper.',
        minutes: 5,
      },
      {
        text: 'Add tomatoes, turmeric and chilli; cook until saucy.',
        minutes: 5,
      },
      {
        text: 'Crumble in the paneer and stir for two minutes.',
        minutes: 3,
      },
    ],
    swaps: [
      {
        missing: 'Paneer',
        use: 'Scrambled eggs make a great egg bhurji.',
      },
    ],
  },
];

export const demoUser: DemoUserSeed = {
  onboarded: false,
  profile: {
    name: 'Alex',
    diet: 'none',
    allergies: [],
    householdSize: 2,
    units: 'metric',
    defaultEffort: 'moderate',
  },
  preferences: { ...DEFAULT_PREFERENCES },
  staples: DEMO_STAPLES,
  autoInclude: true,
  excluded: {},
  saved: [
    { recipeId: 'palak-paneer', savedDaysAgo: 3 },
    { recipeId: 'shakshuka', savedDaysAgo: 8 },
  ],
  cooked: [
    { recipeId: 'egg-fried-rice', cookedDaysAgo: 1, servings: 2 },
    { recipeId: 'paneer-bhurji', cookedDaysAgo: 4, servings: 2 },
  ],
  lastScan: { daysAgo: 2, items: 11 },
  recipes: DEMO_RECIPES,
};
