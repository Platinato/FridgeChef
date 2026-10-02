/**
 * The backend, as the app sees it. Everything else depends on this interface, never on an
 * implementation (`MockApi` / `HttpApi` are only created by `getApi()` in `./index.ts`).
 * Every method takes and returns DOMAIN types; the wire format stays in contract.ts / mappers.ts.
 */
import type {
  CatalogData,
  DetectedItem,
  Kitchen,
  PhotoWarning,
  Preferences,
  Profile,
  Recipe,
  UnitSystem,
} from '@/domain/types';

/** A photo ready to upload: resized to ≤ 1280 px, JPEG ~0.7, base64 (Sprint 07, `services/media`). */
export type PreparedImage = {
  id: string;
  mimeType: string;
  /** Base64 without a `data:` prefix. */
  base64: string;
};

export type DetectInput = {
  images: PreparedImage[];
  /** Staples the user already has, so detection can skip them. */
  knownStapleIds: string[];
  /** e.g. "en-IN". */
  locale: string;
  units: UnitSystem;
};

export type DetectionResult = {
  scanId: string;
  /** Fresh items: value = estimate, displayed in the base unit, untouched. */
  items: DetectedItem[];
  warnings: PhotoWarning[];
};

export type SuggestInput = {
  /** Confirmed items + staples (`useKitchen()`). */
  kitchen: Kitchen;
  prefs: Preferences;
  profile: Pick<Profile, 'allergies'>;
  /** Max recipes to return. Default 12. */
  limit?: number;
};

export interface FridgeChefApi {
  getCatalog(signal?: AbortSignal): Promise<CatalogData>;
  detectIngredients(input: DetectInput, signal?: AbortSignal): Promise<DetectionResult>;
  suggestRecipes(input: SuggestInput, signal?: AbortSignal): Promise<Recipe[]>;
  /** Throws `ApiError` with kind `not_found` for an unknown id. */
  getRecipe(id: string, signal?: AbortSignal): Promise<Recipe>;
}
