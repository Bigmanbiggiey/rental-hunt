import {
  propertyRepository,
  type Cursor,
  type Property,
  type PropertyListResult,
} from '@/entities/property';
import { parsePropertyFilters, type PropertyFiltersRawInput } from '../schemas/propertyFilters.schema';

/**
 * Hook -> Service -> Repository (api-design.md §2.3): the Service is the
 * layer that validates the raw URL filter object, never the Hook, never the
 * Repository.
 */
export const propertySearchService = {
  async list(rawFilters: PropertyFiltersRawInput, cursor?: Cursor): Promise<PropertyListResult> {
    const filters = parsePropertyFilters(rawFilters);
    return propertyRepository.list(filters, cursor);
  },

  async listFeatured(): Promise<Property[]> {
    return propertyRepository.listFeatured();
  },
};
