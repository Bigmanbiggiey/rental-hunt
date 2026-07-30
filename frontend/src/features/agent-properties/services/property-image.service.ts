import { AppError } from '@/shared/lib/errors';
import { propertyImageRepository } from '@/entities/property';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * api-design.md §14 — Zod parses structured JSON data, not a `File`'s
 * binary metadata, so file validation is layered on top as a plain
 * throwing function rather than a schema (AGENT-005).
 */
export function validatePropertyImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new AppError('VALIDATION_ERROR', 'Only JPEG, PNG, or WEBP images are allowed.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'Images must be 5MB or smaller.');
  }
}

export const propertyImageService = {
  async listByProperty(propertyId: string) {
    return propertyImageRepository.listByProperty(propertyId);
  },

  async upload(propertyId: string, file: File, altText?: string) {
    validatePropertyImageFile(file);
    return propertyImageRepository.upload(propertyId, file, altText);
  },

  async delete(imageId: string) {
    return propertyImageRepository.delete(imageId);
  },

  async reorder(propertyId: string, orderedImageIds: string[]) {
    return propertyImageRepository.reorder(propertyId, orderedImageIds);
  },
};
