import { favoritesRepository } from '../repositories/favorites.repository';

/**
 * Trivial passthrough Service — deliberately no Zod. `propertyId` is an
 * opaque ID from an already-rendered card/page (same precedent as
 * `propertyDetailsService.getBySlug`); `page`/`pageSize` are UI-internal
 * numbers, not untrusted external input.
 */
export const favoritesService = {
  save: favoritesRepository.save,
  remove: favoritesRepository.remove,
  list: favoritesRepository.list,
  listIds: favoritesRepository.listIds,
};
