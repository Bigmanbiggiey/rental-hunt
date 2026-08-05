import type {
  Amenity,
  Property,
  PropertyImage,
  PropertyAgent,
  County,
  Location,
  PropertyType,
} from './property.types';

/** Shape of a `public.properties` row joined per `property.repository.ts`'s `PROPERTY_COLUMNS` select, snake_case as PostgREST returns it. */
export interface PropertyRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  agency_id: string;
  agent_id: string;
  property_type_id: string;
  county_id: string;
  location_id: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  deposit_amount: number;
  currency: string;
  availability_status: Property['availabilityStatus'];
  verification_status: Property['verificationStatus'];
  last_verified_at: string | null;
  is_featured: boolean;
  is_archived: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  property_type: { name: string } | null;
  county: { name: string } | null;
  location: { name: string } | null;
  images: PropertyImageRow[];
  amenities: { amenity: AmenityRow }[];
  agent: AgentDirectoryRow | null;
}

export interface PropertyImageRow {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export interface AmenityRow {
  id: string;
  name: string;
  icon: string | null;
}

export interface AgentDirectoryRow {
  agent_id: string;
  agency_id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  bio: string | null;
  agency_name: string;
}

export interface CountyRow {
  id: string;
  name: string;
}

export interface LocationRow {
  id: string;
  county_id: string;
  name: string;
}

export interface PropertyTypeRow {
  id: string;
  name: string;
}

function mapImageRow(row: PropertyImageRow): PropertyImage {
  return {
    id: row.id,
    propertyId: '', // filled by the caller if needed; omitted from the select to keep payload small
    imageUrl: row.image_url,
    altText: row.alt_text,
    displayOrder: row.display_order,
  };
}

function mapAmenityRow(row: AmenityRow): Amenity {
  return { id: row.id, name: row.name, icon: row.icon };
}

function mapAgentRow(row: AgentDirectoryRow): PropertyAgent {
  return {
    id: row.agent_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    jobTitle: row.job_title,
    bio: row.bio,
    agencyId: row.agency_id,
    agencyName: row.agency_name,
  };
}

/**
 * `property_type`/`county`/`location`/`agent` are only ever null when RLS
 * hides the parent property's referenced row entirely (shouldn't happen for
 * required, non-nullable FKs under normal operation) — mapped to an empty
 * placeholder rather than throwing, since a display glitch is preferable to
 * a crashed listing page for one bad row.
 */
export function mapPropertyRow(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    agencyId: row.agency_id,
    agentId: row.agent_id,
    propertyTypeId: row.property_type_id,
    propertyTypeName: row.property_type?.name ?? '',
    countyId: row.county_id,
    countyName: row.county?.name ?? '',
    locationId: row.location_id,
    locationName: row.location?.name ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    rentAmount: row.rent_amount,
    depositAmount: row.deposit_amount,
    currency: row.currency,
    availabilityStatus: row.availability_status,
    verificationStatus: row.verification_status,
    lastVerifiedAt: row.last_verified_at,
    isFeatured: row.is_featured,
    isArchived: row.is_archived,
    viewCount: row.view_count,
    images: row.images.map(mapImageRow).sort((a, b) => a.displayOrder - b.displayOrder),
    amenities: row.amenities.map((a) => mapAmenityRow(a.amenity)),
    agent: row.agent
      ? mapAgentRow(row.agent)
      : {
          id: row.agent_id,
          fullName: '',
          avatarUrl: null,
          jobTitle: null,
          bio: null,
          agencyId: row.agency_id,
          agencyName: '',
        },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCountyRow(row: CountyRow): County {
  return { id: row.id, name: row.name };
}

export function mapLocationRow(row: LocationRow): Location {
  return { id: row.id, countyId: row.county_id, name: row.name };
}

export function mapPropertyTypeRow(row: PropertyTypeRow): PropertyType {
  return { id: row.id, name: row.name };
}
