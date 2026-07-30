import type { ViewingRequest, ViewingRequestCustomer, ViewingRequestProperty } from './viewing-request.types';

/** Shape of a `public.viewing_requests` row joined with the slim `property:properties(...)` and `customer:profiles(...)` embeds, snake_case as PostgREST returns it. */
export interface ViewingRequestRow {
  id: string;
  customer_id: string;
  property_id: string;
  agent_id: string;
  requested_date: string;
  requested_time: string;
  status: ViewingRequest['status'];
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  property: ViewingRequestPropertyRow | null;
  customer: ViewingRequestCustomerRow | null;
}

export interface ViewingRequestPropertyRow {
  id: string;
  slug: string;
  title: string;
  images: { id: string; image_url: string; alt_text: string | null; display_order: number }[];
}

export interface ViewingRequestCustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
}

function mapCustomerRow(row: ViewingRequestCustomerRow): ViewingRequestCustomer {
  return { id: row.id, fullName: row.full_name, phone: row.phone };
}

function mapPropertyRow(row: ViewingRequestPropertyRow): ViewingRequestProperty {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    images: row.images
      .map((image) => ({
        id: image.id,
        propertyId: row.id,
        imageUrl: image.image_url,
        altText: image.alt_text,
        displayOrder: image.display_order,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder),
  };
}

/**
 * `property` is only ever null when RLS hides the referenced property row
 * entirely (shouldn't happen under normal operation, same reasoning as
 * `property.mapper.ts`'s `mapPropertyRow`) — mapped to an empty placeholder
 * rather than throwing, so one bad row can't crash an entire booking list.
 */
export function mapViewingRequestRow(row: ViewingRequestRow): ViewingRequest {
  return {
    id: row.id,
    customerId: row.customer_id,
    propertyId: row.property_id,
    agentId: row.agent_id,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    status: row.status,
    notes: row.notes,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    property: row.property
      ? mapPropertyRow(row.property)
      : { id: row.property_id, slug: '', title: '', images: [] },
    customer: row.customer ? mapCustomerRow(row.customer) : null,
  };
}
