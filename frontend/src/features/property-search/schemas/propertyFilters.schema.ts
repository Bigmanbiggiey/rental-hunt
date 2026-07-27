import { z } from 'zod';
import type { PropertyFilters, PropertySortOrder } from '@/entities/property';

/**
 * The URL query string is untrusted external input a guest can hand-edit or
 * share (`?minPrice=abc&bedrooms=-5`) — a real boundary per
 * coding-standards.md's "unknown + type guards at every external boundary"
 * principle, even though this sprint has no writes. Deliberately **lenient**
 * (`.catch()` fallbacks, never `parseOrThrow`): DISC-002/006 require
 * malformed input to degrade to an empty/default state, never a crash or a
 * rejected page load — the opposite of the strict write-path Zod convention
 * used elsewhere (api-design.md §14).
 */
const uuidOrUndefined = z.string().uuid().optional().catch(undefined);
const nonNegativeIntOrUndefined = z.coerce.number().int().min(0).optional().catch(undefined);
const nonNegativeNumberOrUndefined = z.coerce.number().min(0).optional().catch(undefined);

const SORT_VALUES = ['price_asc', 'price_desc', 'newest'] as const satisfies readonly PropertySortOrder[];
const sortOrUndefined = z.enum(SORT_VALUES).optional().catch(undefined);

export const PropertyFiltersSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  county: uuidOrUndefined,
  propertyType: uuidOrUndefined,
  bedroomsMin: nonNegativeIntOrUndefined,
  bedroomsMax: nonNegativeIntOrUndefined,
  minPrice: nonNegativeNumberOrUndefined,
  maxPrice: nonNegativeNumberOrUndefined,
  amenities: z.array(z.string().uuid()).catch([]),
  sort: sortOrUndefined,
});

/** Raw shape read directly off `URLSearchParams` by `useSearchFilters`. */
export interface PropertyFiltersRawInput {
  q?: string;
  county?: string;
  propertyType?: string;
  bedroomsMin?: string;
  bedroomsMax?: string;
  minPrice?: string;
  maxPrice?: string;
  amenities?: string[];
  sort?: string;
}

export function parsePropertyFilters(input: PropertyFiltersRawInput): PropertyFilters {
  const parsed = PropertyFiltersSchema.parse(input);
  return {
    q: parsed.q,
    county: parsed.county,
    propertyType: parsed.propertyType,
    bedroomsMin: parsed.bedroomsMin,
    bedroomsMax: parsed.bedroomsMax,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    amenities: parsed.amenities.length > 0 ? parsed.amenities : undefined,
    sort: parsed.sort,
  };
}
