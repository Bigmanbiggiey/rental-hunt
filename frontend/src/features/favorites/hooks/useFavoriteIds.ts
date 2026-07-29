import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { favoritesService } from '../services/favorites.service';

/** Shared across every `PropertyCard`-rendering widget/page — TanStack Query dedupes this key into one cached request regardless of how many call sites use it. */
export const FAVORITE_IDS_KEY = ['favorites', 'ids'] as const;

/** Returns the current customer's favorited property IDs; an empty set for guests (never fetched). */
export function useFavoriteIds() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: FAVORITE_IDS_KEY,
    queryFn: async () => new Set(await favoritesService.listIds()),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
