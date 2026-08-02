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

const IMAGE_UPLOAD_RATE_LIMIT = 20;
const IMAGE_UPLOAD_RATE_WINDOW_SECONDS = 60 * 60;

export const propertyImageService = {
  async listByProperty(propertyId: string) {
    return propertyImageRepository.listByProperty(propertyId);
  },

  /**
   * api-design.md §18's Service-layer rate limit ("20 per hour, per agent").
   * `agentId` is threaded in by the caller (`useUploadPropertyImage`, via
   * `useCurrentAgent()`) rather than resolved here, mirroring how
   * `agentPropertyService`'s own methods already take a resolved agent/
   * agency id instead of re-deriving it per call.
   */
  async upload(propertyId: string, file: File, agentId: string, altText?: string) {
    validatePropertyImageFile(file);

    const windowStart = new Date(Date.now() - IMAGE_UPLOAD_RATE_WINDOW_SECONDS * 1000).toISOString();
    const recentCount = await propertyImageRepository.countRecentByAgent(agentId, windowStart);
    if (recentCount >= IMAGE_UPLOAD_RATE_LIMIT) {
      throw new AppError('RATE_LIMITED', 'Too many image uploads. Please try again later.', {
        retryAfterSeconds: String(IMAGE_UPLOAD_RATE_WINDOW_SECONDS),
      });
    }

    return propertyImageRepository.upload(propertyId, file, altText);
  },

  async delete(imageId: string) {
    return propertyImageRepository.delete(imageId);
  },

  async reorder(propertyId: string, orderedImageIds: string[]) {
    return propertyImageRepository.reorder(propertyId, orderedImageIds);
  },
};
