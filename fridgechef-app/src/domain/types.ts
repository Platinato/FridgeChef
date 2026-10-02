/**
 * App-facing domain types. Pure data: no React, no IO.
 * Wire DTOs live in `services/api/contract.ts` (Sprint 05); mappers convert between the two.
 */

// ---------- Shared enums ----------

/** How sure detection is about an item. `manual` = added by the user. */
export type Confidence = 'high' | 'med' | 'low';
export type ItemConfidence = Confidence | 'manual';

export type RecipeDiet = 'nonveg' | 'egg' | 'veg' | 'vegan';
export type DietPref = 'none' | 'veg' | 'vegan' | 'egg' | 'keto' | 'protein' | 'jain';
export type EffortPref = 'minimal' | 'moderate' | 'chef';
export type Hunger = 'snack' | 'meal' | 'starving';
export type UnitSystem = 'metric' | 'imperial';
export type FilterId = 'all' | 'everything' | 'quick' | 'onepan' | 'protein';
export type SortId = 'best' | 'quick' | 'effort' | 'protein';
export type PhotoWarningType = 'blurry' | 'dark' | 'no_food';
export type ScanStatus = 'draft' | 'detected' | 'confirmed';

// ---------- Scan ----------

/** A photo in the current scan (max 6). */
export type Photo = {
  id: string;
  /** Local file URI (camera / picker) or a remote demo image URL. */
  uri: string;
  label?: string;
  /** The user retook it after a warning. */
  retaken: boolean;
};

export type PhotoWarning = {
  /** Index into the scan's photos. */
  photoIndex: number;
  type: PhotoWarningType;
  message: string;
};

/** Another unit the user can view an item in. `factor` = how many base `unit` in one alt unit (240 ml per cup). */
export type AltUnit = { unit: string; factor: number; step: number };

/** A detected (or manually added) ingredient. `value` is always stored in the base `unit`. */
export type DetectedItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** The detection's estimate in `unit`; `null` for manual items. */
  estimate: number | null;
  /** Confirmed amount, in `unit`. */
  value: number;
  /** The unit the user is viewing it in: `unit` or `altUnit.unit`. */
  displayUnit: string;
  altUnit?: AltUnit;
  confidence: ItemConfidence;
  /** Which photo it was spotted in; `null` for manual items. */
  photoIndex: number | null;
  imageUrl?: string;
  /** The user moved the slider, stepped, or tapped "Looks right". */
  touched: boolean;
};

export type LastScan = { at: string; items: number };

/** The current scan: photos → detection → confirmed quantities. */
export type ScanSession = {
  id: string;
  createdAt: string;
  /** Set when the user passes the confirm gate; cleared by a new detection. */
  confirmedAt: string | null;
  status: ScanStatus;
  photos: Photo[];
  items: DetectedItem[];
  warnings: PhotoWarning[];
};

// ---------- Pantry ----------

export type Staple = {
  id: string;
  name: string;
  category: string;
  /** Pack size hint, e.g. "~100 g jar". */
  unitHint: string;
  /** Recipe unit (tsp, tbsp, cup). */
  unit: string;
  /** Recipe units that use up one bar. */
  perLevel: number;
  /** 0-5 bars, fractional allowed. */
  level: number;
  /** ISO timestamp of the last level change. */
  updatedAt: string;
};

// ---------- Recipes ----------

export type RecipeIngredient = { id: string; name: string; qty: number; unit: string };
export type Step = { text: string; minutes: number };
export type Swap = { missing: string; use: string };
export type Nutrition = { kcal: number; protein: number; carbs: number; fat: number };

export type Recipe = {
  id: string;
  name: string;
  subtitle: string;
  cuisine: string;
  diet: RecipeDiet;
  timeMin: number;
  /** 1-5 */
  effort: number;
  /** 1-5 */
  spice: number;
  /** Ingredient quantities are for this many servings. */
  servings: number;
  nutrition: Nutrition;
  moods: string[];
  equipment: string[];
  onePan: boolean;
  image?: string;
  ingredients: RecipeIngredient[];
  steps: Step[];
  swaps: Swap[];
};

// ---------- Profile + preferences ----------

export type Profile = {
  name: string;
  diet: DietPref;
  allergies: string[];
  householdSize: number;
  units: UnitSystem;
  defaultEffort: EffortPref;
};

/** The last Mood screen choices, plus the Suggestions filter chip and sort. */
export type Preferences = {
  mood: string;
  timeMin: number;
  effort: EffortPref;
  servings: number;
  hunger: Hunger;
  cuisines: string[];
  diet: DietPref;
  equipment: string[];
  /** 1-5 */
  spice: number;
  filter: FilterId;
  sort: SortId;
};

// ---------- Matching ----------

/** What the user has to cook with: confirmed items plus remembered staples. */
export type Kitchen = {
  items: DetectedItem[];
  staples: Staple[];
  autoInclude: boolean;
  /** Staple id → true when the user switched it off for this scan. */
  excluded: Record<string, boolean>;
};

export type IngredientState = 'have' | 'short' | 'missing' | 'pantry';

/** One recipe ingredient vs. the kitchen. */
export type IngredientStatus = {
  kind: 'detected' | 'staple' | 'extra';
  name: string;
  /** Amount needed for the chosen servings, in the recipe unit. */
  need: number;
  /** Detected items only: the confirmed amount (base unit). */
  have?: number;
  imageUrl?: string;
  status: IngredientState;
};

export type MatchRow = RecipeIngredient & IngredientStatus;

export type MatchResult = {
  rows: MatchRow[];
  have: number;
  total: number;
  /** 0-100, rounded. */
  pct: number;
  /** Missing or short rows. */
  missing: MatchRow[];
};

export type Suggestion = { recipe: Recipe; match: MatchResult; score: number };

// ---------- Catalog ----------

export type CatalogMood = { id: string; label: string; icon: string };
export type CatalogOption = { id: string; label: string };
export type AddableItem = {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};
export type StapleSuggestion = { name: string; category: string };
export type DefaultStaple = Omit<Staple, 'level' | 'updatedAt'>;

export type CatalogData = {
  moods: CatalogMood[];
  cuisines: string[];
  diets: CatalogOption[];
  allergies: string[];
  equipment: CatalogOption[];
  addableItems: AddableItem[];
  stapleSuggestions: StapleSuggestion[];
  defaultStaples: DefaultStaple[];
};
