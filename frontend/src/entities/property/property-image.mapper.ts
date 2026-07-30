import type { PropertyImage } from './property.types';

/** Shape of a standalone `public.property_images` row (not the embedded-within-`properties` shape in `property.mapper.ts`, which omits `property_id`). */
export interface PropertyImageDetailRow {
  id: string;
  property_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export function mapPropertyImageRow(row: PropertyImageDetailRow): PropertyImage {
  return {
    id: row.id,
    propertyId: row.property_id,
    imageUrl: row.image_url,
    altText: row.alt_text,
    displayOrder: row.display_order,
  };
}
