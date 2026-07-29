import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/entities/user';
import { PATHS } from '@/shared/config';
import { favoritesService } from '../services/favorites.service';
import { FAVORITE_IDS_KEY } from './useFavoriteIds';

interface ToggleFavoriteInput {
  propertyId: string;
  isSaved: boolean;
}

interface ToggleFavoriteContext {
  previous?: Set<string>;
}

/**
 * The single sanctioned place guest-redirect and optimistic UI live for
 * favoriting (ui-guidelines.md §12.12: "clicking prompts login" for guests,
 * "toggle visually first, reconcile on response" for customers) — every
 * `PropertyCard`-rendering widget/page just wires props to this hook, no
 * duplicated logic per call site.
 */
export function useToggleFavorite() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<void, unknown, ToggleFavoriteInput, ToggleFavoriteContext>({
    mutationFn: async ({ propertyId, isSaved }) => {
      if (!profile) {
        navigate(PATHS.public.login);
        return;
      }
      await (isSaved ? favoritesService.remove(propertyId) : favoritesService.save(propertyId));
    },
    onMutate: async ({ propertyId, isSaved }) => {
      if (!profile) return {};

      await queryClient.cancelQueries({ queryKey: FAVORITE_IDS_KEY });
      const previous = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_KEY);
      queryClient.setQueryData<Set<string>>(FAVORITE_IDS_KEY, (old) => {
        const next = new Set(old ?? []);
        if (isSaved) {
          next.delete(propertyId);
        } else {
          next.add(propertyId);
        }
        return next;
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(FAVORITE_IDS_KEY, context.previous);
      toast.error('Something went wrong. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITE_IDS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['favorites', 'list'] });
    },
  });
}
