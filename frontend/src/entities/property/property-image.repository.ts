import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
import { mapPropertyImageRow, type PropertyImageDetailRow } from './property-image.mapper';
import type { PropertyImage } from './property.types';

export interface PropertyImageRepository {
  listByProperty(propertyId: string): Promise<PropertyImage[]>;
  upload(propertyId: string, file: File, altText?: string): Promise<PropertyImage>;
  delete(imageId: string): Promise<void>;
  reorder(propertyId: string, orderedImageIds: string[]): Promise<PropertyImage[]>;
}

const BUCKET = 'property-images';
const IMAGE_COLUMNS = 'id, property_id, image_url, alt_text, display_order';

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

export const propertyImageRepository: PropertyImageRepository = {
  async listByProperty(propertyId) {
    const { data, error } = await supabase
      .from('property_images')
      .select(IMAGE_COLUMNS)
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true })
      .returns<PropertyImageDetailRow[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapPropertyImageRow);
  },

  // Two-step flow (api-design.md §10.1: storage upload, then metadata
  // insert) as one method. On metadata-insert failure, the just-uploaded
  // storage object is removed before rethrowing — the concrete mechanism
  // for AGENT-005's "upload failures do not corrupt or remove existing
  // images": existing rows are untouched regardless, and this additionally
  // guarantees no orphaned Storage object survives a failed upload.
  async upload(propertyId, file, altText) {
    const path = `${propertyId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) throw mapSupabaseError(uploadError);

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data: maxOrderRow } = await supabase
      .from('property_images')
      .select('display_order')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle<{ display_order: number }>();

    const nextOrder = (maxOrderRow?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('property_images')
      .insert({
        property_id: propertyId,
        image_url: publicUrlData.publicUrl,
        alt_text: altText ?? null,
        display_order: nextOrder,
      })
      .select(IMAGE_COLUMNS)
      .single<PropertyImageDetailRow>();

    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw mapSupabaseError(error);
    }

    return mapPropertyImageRow(data);
  },

  // DB row deleted first (immediate gallery update); Storage removal is
  // best-effort — an orphaned Storage object is a minor cost, not a
  // user-facing correctness bug, since the DB row (the gallery's source of
  // truth) is already gone regardless of whether the Storage call succeeds.
  async delete(imageId) {
    const { data, error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId)
      .select('image_url')
      .single<{ image_url: string }>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'IMAGE_NOT_FOUND' });

    const path = storagePathFromPublicUrl(data.image_url);
    if (path) {
      try {
        await supabase.storage.from(BUCKET).remove([path]);
      } catch {
        // best-effort only, see note above
      }
    }
  },

  // Metadata-only — no Storage interaction, matches api-design.md §10.1.
  async reorder(propertyId, orderedImageIds) {
    const results = await Promise.all(
      orderedImageIds.map((id, index) =>
        supabase
          .from('property_images')
          .update({ display_order: index })
          .eq('id', id)
          .eq('property_id', propertyId),
      ),
    );

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw mapSupabaseError(firstError);

    return propertyImageRepository.listByProperty(propertyId);
  },
};
