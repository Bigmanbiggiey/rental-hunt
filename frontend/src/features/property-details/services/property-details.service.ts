import { propertyRepository, type Property } from '@/entities/property';

/**
 * Trivial passthrough Service — no Zod schema. A `:slug` route param is an
 * opaque path segment already matched by React Router, not an ambiguous
 * filter object needing lenient parsing like `property-search`'s case.
 * Still kept as a real Service (not a Hook calling the Repository directly)
 * per api-design.md §2.3's Hook -> Service -> Repository chain.
 */
export const propertyDetailsService = {
  async getBySlug(slug: string): Promise<Property> {
    return propertyRepository.getBySlug(slug);
  },

  async listRelated(property: Property): Promise<Property[]> {
    return propertyRepository.listRelated({
      propertyId: property.id,
      countyId: property.countyId,
      propertyTypeId: property.propertyTypeId,
    });
  },
};
