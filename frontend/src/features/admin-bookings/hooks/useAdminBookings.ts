import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminBookingsService } from '../services/admin-bookings.service';

export function useAdminBookings(page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'bookings', page, pageSize],
    queryFn: () => adminBookingsService.list(page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
