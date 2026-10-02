/**
 * DTO ⇄ domain. The ONLY place that knows how wire fields map to app fields (with contract.ts
 * and http/endpoints.ts). If the real backend's shape differs, adapt it here.
 */
import { stapleOn } from '@/domain/matching';
import type { CatalogData, DetectedItem, PhotoWarning, Recipe } from '@/domain/types';
import { clamp } from '@/domain/units';

import type {
  CatalogDto,
  DetectRequestDto,
  DetectResponseDto,
  DetectedItemDto,
  PhotoWarningDto,
  RecipeDto,
  SuggestRequestDto,
} from './contract';
import type { DetectInput, DetectionResult, SuggestInput } from './FridgeChefApi';

export const DEFAULT_SUGGEST_LIMIT = 12;

// ---------- DTO → domain ----------

export const toCatalog = (dto: CatalogDto): CatalogData => ({
  moods: dto.moods.map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
  cuisines: [...dto.cuisines],
  diets: dto.diets.map((d) => ({ id: d.id, label: d.label })),
  allergies: [...dto.allergies],
  equipment: dto.equipment.map((e) => ({ id: e.id, label: e.label })),
  addableItems: dto.addableItems.map((a) => ({ ...a })),
  stapleSuggestions: dto.stapleSuggestions.map((s) => ({ ...s })),
  defaultStaples: dto.defaultStaples.map((s) => ({ ...s })),
});

/** A fresh detection: value = the estimate (inside the range), base unit, not yet checked. */
export const toDetectedItem = (dto: DetectedItemDto): DetectedItem => ({
  id: dto.id,
  name: dto.name,
  category: dto.category,
  unit: dto.unit,
  min: dto.min,
  max: dto.max,
  step: dto.step,
  estimate: dto.estimate,
  value: clamp(dto.estimate, dto.min, dto.max),
  displayUnit: dto.unit,
  ...(dto.altUnit && { altUnit: { ...dto.altUnit } }),
  confidence: dto.confidence,
  photoIndex: dto.photoIndex,
  ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
  touched: false,
});

export const toPhotoWarning = (dto: PhotoWarningDto): PhotoWarning => ({
  photoIndex: dto.photoIndex,
  type: dto.type,
  message: dto.message,
});

export const toDetectionResult = (dto: DetectResponseDto): DetectionResult => ({
  scanId: dto.scanId,
  items: dto.items.map(toDetectedItem),
  warnings: dto.photoWarnings.map(toPhotoWarning),
});

export const toRecipe = (dto: RecipeDto): Recipe => ({
  id: dto.id,
  name: dto.name,
  subtitle: dto.subtitle,
  cuisine: dto.cuisine,
  diet: dto.diet,
  timeMin: dto.timeMin,
  effort: dto.effort,
  spice: dto.spice,
  servings: dto.servings,
  nutrition: { ...dto.nutrition },
  moods: [...dto.moods],
  equipment: [...dto.equipment],
  onePan: dto.onePan,
  ...(dto.imageUrl !== undefined && { image: dto.imageUrl }),
  ingredients: dto.ingredients.map((i) => ({ id: i.id, name: i.name, qty: i.qty, unit: i.unit })),
  steps: dto.steps.map((s) => ({ text: s.text, minutes: s.minutes })),
  swaps: dto.swaps.map((s) => ({ missing: s.missing, use: s.use })),
});

// ---------- domain → DTO ----------

export const toDetectRequest = (input: DetectInput): DetectRequestDto => ({
  images: input.images.map((img) => ({ id: img.id, mimeType: img.mimeType, data: img.base64 })),
  knownStapleIds: [...input.knownStapleIds],
  locale: input.locale,
  units: input.units,
});

/**
 * The confirmed kitchen + preferences as a suggest request. Only items the user has (value > 0,
 * in the base unit) and staples that count right now (`stapleOn`) are sent.
 */
export function toSuggestRequest(input: SuggestInput): SuggestRequestDto {
  const { kitchen, prefs, profile, limit = DEFAULT_SUGGEST_LIMIT } = input;
  return {
    ingredients: kitchen.items
      .filter((d) => d.value > 0)
      .map((d) => ({ id: d.id, name: d.name, quantity: d.value, unit: d.unit })),
    staples: kitchen.staples
      .filter((s) => stapleOn(s, kitchen))
      .map((s) => ({ id: s.id, name: s.name, level: s.level })),
    preferences: {
      mood: prefs.mood,
      timeMin: prefs.timeMin,
      effort: prefs.effort,
      servings: prefs.servings,
      hunger: prefs.hunger,
      cuisines: [...prefs.cuisines],
      diet: prefs.diet,
      allergies: [...profile.allergies],
      equipment: [...prefs.equipment],
      spice: prefs.spice,
    },
    limit,
  };
}
