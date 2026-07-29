import { useQuery } from '@tanstack/react-query';
import { favoritesService } from '../services/favorites.service';

/** FAV-003 — the customer's own paginated Favorites page. */
export function useFavorites(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['favorites', 'list', page, pageSize],
    queryFn: () => favoritesService.list(page, pageSize),
    staleTime: 30_000,
  });
}
