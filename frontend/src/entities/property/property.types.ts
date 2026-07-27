import type { ISODateTime, UUID } from '@/entities/user';

/** api-design.md §3.1. */
export interface PropertyImage {
  id: UUID;
  propertyId: UUID;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
}

/** api-design.md §3.1. */
export interface Amenity {
  id: UUID;
  name: string;
  icon: string | null;
}

export type PropertyAvailabilityStatus = 'available' | 'reserved' | 'occupied' | 'hidden';
export type PropertyVerificationStatus =
  | 'unverified'
  | 'pending_verification'
  | 'verified'
  | 'rejected';

/** The public-safe agent subset every Property carries (api-design.md §3.1's `Pick<Agent, ...>`). */
export interface PropertyAgent {
  id: UUID;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  bio: string | null;
  agencyId: UUID;
}

/** api-design.md §3.1. */
export interface Property {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  agencyId: UUID;
  agentId: UUID;
  propertyTypeId: UUID;
  propertyTypeName: string;
  countyId: UUID;
  countyName: string;
  locationId: UUID;
  locationName: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  depositAmount: number;
  currency: string;
  availabilityStatus: PropertyAvailabilityStatus;
  verificationStatus: PropertyVerificationStatus;
  lastVerifiedAt: ISODateTime | null;
  isFeatured: boolean;
  isArchived: boolean;
  viewCount: number;
  images: PropertyImage[];
  amenities: Amenity[];
  agent: PropertyAgent;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** database.md §4.4 reference tables — populate the search filter bar. */
export interface County {
  id: UUID;
  name: string;
}

export interface Location {
  id: UUID;
  countyId: UUID;
  name: string;
}

export interface PropertyType {
  id: UUID;
  name: string;
}

export type PropertySortOrder = 'price_asc' | 'price_desc' | 'newest';

/** api-design.md §17 — the full combinable filter set for `GET /properties`. */
export interface PropertyFilters {
  q?: string;
  county?: UUID;
  propertyType?: UUID;
  bedroomsMin?: number;
  bedroomsMax?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: UUID[];
  sort?: PropertySortOrder;
}

/** api-design.md §16.1 — opaque to callers; only ever passed back verbatim. */
export type Cursor = string;

export interface PropertyListMeta {
  nextCursor: Cursor | null;
  hasMore: boolean;
}

export interface PropertyListResult {
  data: Property[];
  meta: PropertyListMeta;
}
