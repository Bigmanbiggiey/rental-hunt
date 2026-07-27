import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
import {
  mapCountyRow,
  mapLocationRow,
  mapPropertyTypeRow,
  type CountyRow,
  type LocationRow,
  type PropertyTypeRow,
} from './property.mapper';
import type { Amenity, County, Location, PropertyType } from './property.types';
import type { AmenityRow } from './property.mapper';

/**
 * Four small reference-data reads (database.md §4.4), bundled in one file
 * rather than four — they're always fetched together to populate the
 * search filter bar (FilterBar/FilterDrawer, `features/property-search`).
 */
export interface ReferenceDataRepository {
  listCounties(): Promise<County[]>;
  listLocations(countyId?: string): Promise<Location[]>;
  listPropertyTypes(): Promise<PropertyType[]>;
  listAmenities(): Promise<Amenity[]>;
}

export const referenceDataRepository: ReferenceDataRepository = {
  async listCounties() {
    const { data, error } = await supabase
      .from('counties')
      .select('id, name')
      .order('name')
      .returns<CountyRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapCountyRow);
  },

  async listLocations(countyId) {
    let query = supabase.from('locations').select('id, county_id, name').order('name');
    if (countyId) query = query.eq('county_id', countyId);
    const { data, error } = await query.returns<LocationRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapLocationRow);
  },

  async listPropertyTypes() {
    const { data, error } = await supabase
      .from('property_types')
      .select('id, name')
      .order('name')
      .returns<PropertyTypeRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapPropertyTypeRow);
  },

  async listAmenities() {
    const { data, error } = await supabase
      .from('amenities')
      .select('id, name, icon')
      .order('name')
      .returns<AmenityRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map((row) => ({ id: row.id, name: row.name, icon: row.icon }));
  },
};
