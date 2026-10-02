/** Query keys. Suggestions are keyed by a stable hash of exactly what the backend would receive. */
import { toSuggestRequest } from '@/services/api/mappers';
import type { SuggestInput } from '@/services/api';

/** JSON with object keys sorted, so equal values always give equal strings. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** FNV-1a (32-bit) as 8 hex chars: short, stable, good enough for cache keys. */
export function hashString(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const queryKeys = {
  catalog: ['catalog'] as const,
  suggestionsAll: ['suggestions'] as const,
  /** Confirmed kitchen + preferences as sent (client-side filter / sort don't refetch). */
  suggestions: (input: SuggestInput) =>
    ['suggestions', hashString(stableStringify(toSuggestRequest(input)))] as const,
  recipe: (id: string) => ['recipe', id] as const,
  demoPhotos: ['demoPhotos'] as const,
};
