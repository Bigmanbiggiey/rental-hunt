import type { Agency } from './agency.types';

/** Shape of a raw `public.agencies` row (database.md §5.3), snake_case as PostgREST returns it. */
export interface AgencyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  county_id: string | null;
  is_active: boolean;
}

export function mapAgencyRow(row: AgencyRow): Agency {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    phone: row.phone,
    email: row.email,
    countyId: row.county_id,
    isActive: row.is_active,
  };
}
